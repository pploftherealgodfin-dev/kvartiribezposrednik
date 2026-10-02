import { signPhotoPaths, removePhotoObject } from '@/lib/storage';
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

  const { data: metrics, error: metricsError } = await supabase.rpc('owner_metrics');
  if (metricsError) throw metricsError;
  const byId = new Map<string, any>((metrics ?? []).map((item: any) => [item.listing_id, item]));
  const listings: OwnerListingRow[] = rows.map(row => {
    const metric = byId.get(row.id);
    return { id: row.id, slug: row.slug, title: row.title, status: row.status as ListingStatus,
      priceEur: toNumber(row.price_eur), createdAt: row.created_at,
      views: toNumber(metric?.views), uniqueViews: toNumber(metric?.unique_views),
      favorites: toNumber(metric?.favorites), photos: toNumber(metric?.photos) };
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
  nearbyUniversityIds: string[];
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
  id: string = crypto.randomUUID(),
): Promise<{ id: string; slug: string }> {
  const slug = `${slugifyTitle(input.title)}-${id.slice(0, 6)}`;
  const recover = async (): Promise<{ id: string; slug: string } | null> => {
      const { data: existing, error: readError } = await supabase.from('listings').select('id,slug,owner_id,title,description,city_id,neighborhood_id,price_eur,area_m2,rooms,type,deposit,floor,total_floors,furnished,pets_allowed,utilities_included,available_from,nearby_university_ids').eq('id',id).maybeSingle();
      if (readError) throw readError;
      if (existing?.owner_id === ownerId) {
        const same = existing.title === input.title && existing.description === input.description && existing.city_id === input.cityId && existing.neighborhood_id === input.neighborhoodId && Number(existing.price_eur) === input.priceEur && Number(existing.area_m2) === input.areaM2 && existing.rooms === input.rooms && existing.type === input.type && (existing.deposit == null ? null : Number(existing.deposit)) === input.deposit && existing.floor === input.floor && existing.total_floors === input.totalFloors && existing.furnished === input.furnished && existing.pets_allowed === input.petsAllowed && existing.utilities_included === input.utilitiesIncluded && existing.available_from === input.availableFrom && JSON.stringify(existing.nearby_university_ids) === JSON.stringify(input.nearbyUniversityIds);
        if (!same) throw new Error('Тази обява вече е записана с предишните данни. Провери я в панела, преди да създадеш друга.');
        return { id: existing.id, slug: existing.slug };
      }
      return null;
  };
  const prior = await recover(); if (prior) return prior;

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
    nearby_university_ids: input.nearbyUniversityIds,
  });
  if (error) {
    const found = await recover(); if (found) return found;
    throw error;
  }
  return { id, slug };
}

export async function changeOwnerListingStatus(listingId: string, status: string): Promise<void> {
  const { error } = await supabase.rpc('owner_set_listing_status', { p_id: listingId, p_status: status });
  if (error) throw error;
}
export async function markListingRented(id: string) { await changeOwnerListingStatus(id, 'rented'); }
export async function deactivateListing(id: string) { await changeOwnerListingStatus(id, 'deactivated'); }
export async function resubmitListing(id: string) { await changeOwnerListingStatus(id, 'pending_review'); }

/** Добавя снимки към съществуваща обява, продължавайки номерата по позиция. */
export async function addListingPhotos(listingId: string, urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const { data: positions, error: countError } = await supabase
    .from('listing_photos')
    .select('position')
    .eq('listing_id', listingId);
  if (countError) throw countError;

  const occupied = new Set((positions ?? []).map(row => row.position));
  const free = Array.from({ length: 15 }, (_, i) => i).filter(i => !occupied.has(i));
  if (urls.length > free.length) throw new Error('Максимум 15 снимки.');
  const rows = urls.map((url, index) => ({
    id: crypto.randomUUID(),
    listing_id: listingId,
    storage_path: url,
    position: free[index],
  }));

  const { error } = await supabase.from('listing_photos').insert(rows);
  if (error) {
    // A response can be lost after a successful insert. RLS refuses deletion of linked paths.
    await Promise.allSettled(urls.map(removePhotoObject));
    throw error;
  }
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
    .select('id, storage_path, position')
    .eq('listing_id', listingId)
    .order('position', { ascending: true });
  if (error) throw error;
  const signed = await signPhotoPaths((data ?? []).map(row => row.storage_path));
  return (data ?? []).map(row => ({ id: row.id, position: row.position, url: signed.get(row.storage_path) ?? '' }));
}

/**
 * Записва новия ред на снимките. Позицията се обновява последователно,
 * като първата снимка (позиция 0) е основната.
 */
export async function reorderListingPhotos(listingId: string, orderedIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_listing_photos', { p_listing_id: listingId, p_photo_ids: orderedIds });
  if (error) throw error;
}

export async function deleteListingPhoto(photoId: string): Promise<void> {
  const { data, error: readError } = await supabase.from('listing_photos').select('storage_path').eq('id', photoId).single();
  if (readError) throw readError;
  const { error } = await supabase.from('listing_photos').delete().eq('id', photoId);
  if (error) throw error;
  await removePhotoObject(data.storage_path);
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

async function dailyMetrics(days: number) {
  const { data, error } = await supabase.rpc('owner_daily_metrics', { p_days: days });
  if (error) throw error;
  return (data ?? []) as { listing_id: string; day: string; views: number; favorites: number }[];
}
export async function getOwnerDailyStats(_ownerId: string, days = 30): Promise<DailyPoint[]> {
  const rows = await dailyMetrics(days);
  const totals = new Map<string, DailyPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    totals.set(date, { date, label: `${date.slice(8)}.${date.slice(5,7)}`, views: 0, favorites: 0 });
  }
  for (const row of rows) {
    const point = totals.get(row.day);
    if (point) { point.views += Number(row.views); point.favorites += Number(row.favorites); }
  }
  return [...totals.values()];
}
export async function getOwnerListingTrends(_ownerId: string, days = 14): Promise<Record<string, ListingTrend>> {
  const rows = await dailyMetrics(days);
  const result: Record<string, ListingTrend> = {};
  for (const row of rows.sort((a,b) => a.day.localeCompare(b.day))) {
    const trend = result[row.listing_id] ??= { views: [], favorites: [] };
    trend.views.push(Number(row.views)); trend.favorites.push(Number(row.favorites));
  }
  return result;
}
