import { supabase } from '@/lib/supabase';
import type { ListingStatus, ListingType } from '@/lib/types';

export interface OwnerListingRow {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  priceEur: number;
  createdAt: string;
  views: number;
  uniqueViews: number;
  favorites: number;
  photos: number;
}

export interface OwnerStats {
  listings: OwnerListingRow[];
  totalListings: number;
  totalViews: number;
  totalFavorites: number;
  activeListings: number;
}

interface OwnerListingRaw {
  id: string;
  slug: string;
  title: string;
  status: string;
  price_eur: number | string;
  created_at: string;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Обявите на даден собственик + колко гледания и любими има всяка. */
export async function getOwnerStats(ownerId: string): Promise<OwnerStats> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, slug, title, status, price_eur, created_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as OwnerListingRaw[];
  const ids = rows.map((row) => row.id);

  const viewsByListing = new Map<string, { total: number; unique: number }>();
  const favByListing = new Map<string, number>();
  const photoByListing = new Map<string, number>();

  if (ids.length > 0) {
    const [viewsResult, favResult, photoResult] = await Promise.all([
      supabase.from('listing_views').select('listing_id, viewer_id').in('listing_id', ids),
      supabase.from('favorites').select('listing_id').in('listing_id', ids),
      supabase.from('listing_photos').select('listing_id').in('listing_id', ids),
    ]);
    if (viewsResult.error) throw viewsResult.error;
    if (favResult.error) throw favResult.error;
    if (photoResult.error) throw photoResult.error;

    for (const row of viewsResult.data ?? []) {
      const listingId = row.listing_id as string;
      const entry = viewsByListing.get(listingId) ?? { total: 0, unique: 0 };
      entry.total += 1;
      viewsByListing.set(listingId, entry);
    }
    const uniqueSeen = new Map<string, Set<string>>();
    for (const row of viewsResult.data ?? []) {
      const viewerId = row.viewer_id as string | null;
      if (!viewerId) continue;
      const listingId = row.listing_id as string;
      const set = uniqueSeen.get(listingId) ?? new Set<string>();
      set.add(viewerId);
      uniqueSeen.set(listingId, set);
    }
    for (const [listingId, set] of uniqueSeen) {
      const entry = viewsByListing.get(listingId) ?? { total: 0, unique: 0 };
      entry.unique = set.size;
      viewsByListing.set(listingId, entry);
    }

    for (const row of favResult.data ?? []) {
      const listingId = row.listing_id as string;
      favByListing.set(listingId, (favByListing.get(listingId) ?? 0) + 1);
    }

    for (const row of photoResult.data ?? []) {
      const listingId = row.listing_id as string;
      photoByListing.set(listingId, (photoByListing.get(listingId) ?? 0) + 1);
    }
  }

  const listings: OwnerListingRow[] = rows.map((row) => {
    const viewInfo = viewsByListing.get(row.id) ?? { total: 0, unique: 0 };
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status as ListingStatus,
      priceEur: toNumber(row.price_eur),
      createdAt: row.created_at,
      views: viewInfo.total,
      uniqueViews: viewInfo.unique,
      favorites: favByListing.get(row.id) ?? 0,
      photos: photoByListing.get(row.id) ?? 0,
    };
  });

  return {
    listings,
    totalListings: listings.length,
    totalViews: listings.reduce((sum, item) => sum + item.views, 0),
    totalFavorites: listings.reduce((sum, item) => sum + item.favorites, 0),
    activeListings: listings.filter((item) => item.status === 'active').length,
  };
}

export interface NewListingInput {
  title: string;
  description: string;
  type: ListingType;
  priceEur: number;
  areaM2: number;
  rooms: number;
  cityId: string;
  neighborhoodId: string | null;
  availableFrom: string;
  deposit: number | null;
  floor: number | null;
  totalFloors: number | null;
  furnished: boolean;
  petsAllowed: boolean;
  utilitiesIncluded: boolean;
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
  т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht',
  ъ: 'a', ь: '', ю: 'yu', я: 'ya',
};

export function slugifyTitle(input: string): string {
  const lower = input.toLowerCase();
  const translit = Array.from(lower)
    .map((char) => TRANSLIT[char] ?? char)
    .join('');
  const cleaned = translit
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned || 'obiava';
}

/** Създава нова обява от собственик. Влиза с статус „В преглед“. */
export async function createOwnerListing(
  ownerId: string,
  input: NewListingInput,
): Promise<{ id: string; slug: string }> {
  const id = crypto.randomUUID();
  const slug = `${slugifyTitle(input.title)}-${id.slice(0, 6)}`;

  const { error } = await supabase.from('listings').insert({
    id,
    slug,
    owner_id: ownerId,
    type: input.type,
    status: 'pending_review',
    title: input.title,
    description: input.description,
    price_eur: input.priceEur,
    deposit: input.deposit,
    area_m2: input.areaM2,
    rooms: input.rooms,
    floor: input.floor,
    total_floors: input.totalFloors,
    furnished: input.furnished,
    pets_allowed: input.petsAllowed,
    utilities_included: input.utilitiesIncluded,
    available_from: input.availableFrom,
    city_id: input.cityId,
    neighborhood_id: input.neighborhoodId,
  });
  if (error) throw error;
  return { id, slug };
}

export async function markListingRented(listingId: string): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'rented', rented_at: new Date().toISOString() })
    .eq('id', listingId);
  if (error) throw error;
}

export async function deactivateListing(listingId: string): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'deactivated' })
    .eq('id', listingId);
  if (error) throw error;
}

/** Добавя снимки към съществуваща обява, продължавайки номерата по позиция. */
export async function addListingPhotos(listingId: string, urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const { count, error: countError } = await supabase
    .from('listing_photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);
  if (countError) throw countError;

  const start = count ?? 0;
  const rows = urls.map((url, index) => ({
    id: crypto.randomUUID(),
    listing_id: listingId,
    url,
    position: start + index,
    phash: '',
  }));

  const { error } = await supabase.from('listing_photos').insert(rows);
  if (error) throw error;
}

export interface ListingPhotoRow {
  id: string;
  url: string;
  position: number;
}

/** Всички снимки на една обява, подредени по позиция. */
export async function getListingPhotos(listingId: string): Promise<ListingPhotoRow[]> {
  const { data, error } = await supabase
    .from('listing_photos')
    .select('id, url, position')
    .eq('listing_id', listingId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ListingPhotoRow[];
}

/**
 * Записва новия ред на снимките. Позицията се обновява последователно,
 * като първата снимка (позиция 0) е основната.
 */
export async function reorderListingPhotos(orderedIds: string[]): Promise<void> {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from('listing_photos')
      .update({ position: index })
      .eq('id', orderedIds[index]);
    if (error) throw error;
  }
}

export async function deleteListingPhoto(photoId: string): Promise<void> {
  const { error } = await supabase.from('listing_photos').delete().eq('id', photoId);
  if (error) throw error;
}

export interface DailyPoint {
  /** Ключ на деня, локално време: YYYY-MM-DD. */
  date: string;
  /** Кратка етикет за оста (дд.мм). */
  label: string;
  views: number;
  favorites: number;
}

export interface ListingTrend {
  views: number[];
  favorites: number[];
}

function localDayKey(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Дневна активност (гледания и любими) за обявите на собственика. */
export async function getOwnerDailyStats(ownerId: string, days = 30): Promise<DailyPoint[]> {
  const { data: listingRows, error: listingsError } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_id', ownerId);
  if (listingsError) throw listingsError;

  const ids = (listingRows ?? []).map((row) => row.id as string);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  // Минус един ден буфер заради часовите зони на сървъра.
  const sinceIso = new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const viewsByDay = new Map<string, number>();
  const favsByDay = new Map<string, number>();

  if (ids.length > 0) {
    const [viewsRes, favsRes] = await Promise.all([
      supabase.from('listing_views').select('created_at').in('listing_id', ids).gte('created_at', sinceIso),
      supabase.from('favorites').select('created_at').in('listing_id', ids).gte('created_at', sinceIso),
    ]);
    if (viewsRes.error) throw viewsRes.error;
    if (favsRes.error) throw favsRes.error;

    for (const row of viewsRes.data ?? []) {
      const key = localDayKey(row.created_at as string);
      viewsByDay.set(key, (viewsByDay.get(key) ?? 0) + 1);
    }
    for (const row of favsRes.data ?? []) {
      const key = localDayKey(row.created_at as string);
      favsByDay.set(key, (favsByDay.get(key) ?? 0) + 1);
    }
  }

  const formatter = new Intl.DateTimeFormat('bg-BG', { day: '2-digit', month: '2-digit' });
  const points: DailyPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = localDayKey(day.toISOString());
    points.push({
      date: key,
      label: formatter.format(day),
      views: viewsByDay.get(key) ?? 0,
      favorites: favsByDay.get(key) ?? 0,
    });
  }
  return points;
}

/**
 * Кратка дневна поредица (гледания и любими) за всяка отделна обява на собственика.
 * Използва се за графиките-искри в списъка с обяви.
 */
export async function getOwnerListingTrends(
  ownerId: string,
  days = 14,
): Promise<Record<string, ListingTrend>> {
  const { data: listingRows, error: listingsError } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_id', ownerId);
  if (listingsError) throw listingsError;

  const ids = (listingRows ?? []).map((row) => row.id as string);
  const result: Record<string, ListingTrend> = {};
  if (ids.length === 0) return result;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const sinceIso = new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [viewsRes, favsRes] = await Promise.all([
    supabase
      .from('listing_views')
      .select('listing_id, created_at')
      .in('listing_id', ids)
      .gte('created_at', sinceIso),
    supabase
      .from('favorites')
      .select('listing_id, created_at')
      .in('listing_id', ids)
      .gte('created_at', sinceIso),
  ]);
  if (viewsRes.error) throw viewsRes.error;
  if (favsRes.error) throw favsRes.error;

  const dayKeys: string[] = [];
  for (let index = 0; index < days; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    dayKeys.push(localDayKey(day.toISOString()));
  }
  const dayIndex = new Map(dayKeys.map((key, index) => [key, index]));

  for (const id of ids) {
    result[id] = {
      views: new Array<number>(days).fill(0),
      favorites: new Array<number>(days).fill(0),
    };
  }

  for (const row of viewsRes.data ?? []) {
    const index = dayIndex.get(localDayKey(row.created_at as string));
    const listingId = row.listing_id as string;
    if (index === undefined || !result[listingId]) continue;
    result[listingId].views[index] += 1;
  }
  for (const row of favsRes.data ?? []) {
    const index = dayIndex.get(localDayKey(row.created_at as string));
    const listingId = row.listing_id as string;
    if (index === undefined || !result[listingId]) continue;
    result[listingId].favorites[index] += 1;
  }

  return result;
}