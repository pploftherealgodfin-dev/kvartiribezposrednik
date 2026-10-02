import { signPhotoPaths } from '@/lib/storage';
import { LISTING_EXPIRY } from '@/lib/config';
import { diffInDays } from '@/lib/date';
import { isVisibleInSearch } from '@/lib/listingStateMachine';
import { sortListings } from '@/lib/ranking';
import { filterListings, paginate } from '@/lib/search';
import { supabase } from '@/lib/supabase';
import type {
  City,
  Listing,
  ListingPhoto,
  ListingView,
  Neighborhood,
  PublicUser,
  Report,
  University,
} from '@/lib/types';
import type { Repository, SearchParams } from './types';

interface ListingRow {
  id: string;
  slug: string;
  owner_id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  price_eur: number | string;
  deposit: number | string | null;
  area_m2: number | string;
  rooms: number;
  floor: number | null;
  total_floors: number | null;
  furnished: boolean;
  pets_allowed: boolean;
  utilities_included: boolean;
  available_from: string;
  min_term_months: number;
  city_id: string;
  neighborhood_id: string | null;
  ownership_verified_at: string | null;
  verification_expires_at: string | null;
  verification_method: string | null;
  lat_approx: number | null;
  lng_approx: number | null;
  created_at: string;
  expires_at: string | null;
  rented_at: string | null;
  photos: PhotoRow[] | null;
}

interface PhotoRow {
  id: string;
  listing_id: string;
  storage_path: string;
  url?: string;
  position: number;
  phash: string;
}

interface CityRow {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

interface NeighborhoodRow extends CityRow {
  city_id: string;
}

interface UniversityRow extends CityRow {
  city_id: string;
}

interface ProfileRow {
  id: string;
  name: string;
  owner_verified: boolean;
  created_at: string;
}

interface ReportRow {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  status: string;
  resolved_by: string | null;
  created_at: string;
}

function toNumber(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

function nowDefault(nowIso?: string): string {
  return nowIso ?? new Date().toISOString();
}

function mapCity(row: CityRow): City {
  return { id: row.id, slug: row.slug, name: row.name, lat: row.lat, lng: row.lng };
}

function mapListing(row: ListingRow): Listing {
  const photos: ListingPhoto[] = (row.photos ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((photo) => ({
      id: photo.id,
      listingId: photo.listing_id,
      url: photo.url ?? '',
      position: photo.position,
      phash: photo.phash,
    }));

  return {
    id: row.id,
    slug: row.slug,
    ownerId: row.owner_id,
    type: row.type as Listing['type'],
    status: row.status as Listing['status'],
    title: row.title,
    description: row.description,
    priceEur: toNumber(row.price_eur) ?? 0,
    deposit: toNumber(row.deposit),
    areaM2: toNumber(row.area_m2) ?? 0,
    rooms: row.rooms,
    floor: row.floor,
    totalFloors: row.total_floors,
    furnished: row.furnished,
    petsAllowed: row.pets_allowed,
    utilitiesIncluded: row.utilities_included,
    availableFrom: row.available_from,
    minTermMonths: row.min_term_months,
    cityId: row.city_id,
    neighborhoodId: row.neighborhood_id,
    addressPrivate: '',
    ownershipVerifiedAt: row.ownership_verified_at,
    verificationExpiresAt: row.verification_expires_at,
    verificationMethod: row.verification_method,
    latApprox: toNumber(row.lat_approx) ?? 0,
    lngApprox: toNumber(row.lng_approx) ?? 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    rentedAt: row.rented_at,
    photos,
  };
}

function buildView(
  listing: Listing,
  city: City,
  neighborhood: Neighborhood | null,
  profile: ProfileRow | undefined,
  nowIso: string,
): ListingView {
  const owner: PublicUser = {
    id: listing.ownerId,
    name: profile?.name ?? 'Собственик',
    memberSince: profile?.created_at ?? listing.createdAt,
    verifiedOwner: Boolean(listing.ownershipVerifiedAt && listing.verificationExpiresAt && new Date(listing.verificationExpiresAt).getTime() > new Date(nowIso).getTime()),
  };

  return {
    listing,
    city,
    neighborhood,
    owner,
    badges: {
      verifiedOwner: owner.verifiedOwner,
      isNew: diffInDays(listing.createdAt, nowIso) <= LISTING_EXPIRY.newBadgeDays,
      isRented: listing.status === 'rented',
    },
  };
}

class SupabaseRepository implements Repository {
  private async loadViews(): Promise<ListingView[]> {
    const [listingsResult, citiesResult, neighborhoodsResult, profilesResult] = await Promise.all([
      supabase.from('listings').select('id,slug,owner_id,type,status,title,description,price_eur,deposit,area_m2,rooms,floor,total_floors,furnished,pets_allowed,utilities_included,available_from,min_term_months,city_id,neighborhood_id,lat_approx,lng_approx,created_at,expires_at,rented_at,ownership_verified_at,verification_expires_at,verification_method,photos:listing_photos(id,listing_id,storage_path,position,phash)'),
      supabase.from('cities').select('*'),
      supabase.from('neighborhoods').select('*'),
      supabase.from('profiles').select('id, name, owner_verified, created_at'),
    ]);

    if (listingsResult.error) throw listingsResult.error;
    if (citiesResult.error) throw citiesResult.error;
    if (neighborhoodsResult.error) throw neighborhoodsResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const photoRows = (listingsResult.data ?? []).flatMap(row => row.photos ?? []);
    const signed = await signPhotoPaths(photoRows.map(row => row.storage_path));
    for (const photo of photoRows) (photo as PhotoRow).url = signed.get(photo.storage_path) ?? '';

    const now = nowDefault();
    const cities = (citiesResult.data ?? []) as CityRow[];
    const neighborhoods = (neighborhoodsResult.data ?? []) as NeighborhoodRow[];
    const profiles = (profilesResult.data ?? []) as ProfileRow[];

    const cityMap = new Map(cities.map((city) => [city.id, city]));
    const neighborhoodMap = new Map(neighborhoods.map((item) => [item.id, item]));
    const profileMap = new Map(profiles.map((item) => [item.id, item]));

    const views: ListingView[] = [];
    for (const row of (listingsResult.data ?? []) as ListingRow[]) {
      const city = cityMap.get(row.city_id);
      if (!city) continue;
      const listing = mapListing(row);
      const neighborhoodRow = row.neighborhood_id ? neighborhoodMap.get(row.neighborhood_id) : undefined;
      const neighborhood: Neighborhood | null = neighborhoodRow
        ? {
            id: neighborhoodRow.id,
            cityId: neighborhoodRow.city_id,
            slug: neighborhoodRow.slug,
            name: neighborhoodRow.name,
            lat: neighborhoodRow.lat,
            lng: neighborhoodRow.lng,
          }
        : null;
      views.push(buildView(listing, mapCity(city), neighborhood, profileMap.get(row.owner_id), now));
    }
    return views;
  }

  private visible(views: ListingView[], nowIso: string): ListingView[] {
    return views.filter((view) => isVisibleInSearch(view.listing, nowIso));
  }

  async getCities(): Promise<City[]> {
    const { data, error } = await supabase.from('cities').select('*');
    if (error) throw error;
    return ((data ?? []) as CityRow[]).map(mapCity);
  }

  async getNeighborhoods(cityId?: string): Promise<Neighborhood[]> {
    const { data, error } = await supabase.from('neighborhoods').select('*');
    if (error) throw error;
    const rows = (data ?? []) as NeighborhoodRow[];
    return (cityId ? rows.filter((row) => row.city_id === cityId) : rows).map((row) => ({
      id: row.id,
      cityId: row.city_id,
      slug: row.slug,
      name: row.name,
      lat: row.lat,
      lng: row.lng,
    }));
  }

  async getUniversities(cityId?: string): Promise<University[]> {
    const { data, error } = await supabase.from('universities').select('*');
    if (error) throw error;
    const rows = (data ?? []) as UniversityRow[];
    return (cityId ? rows.filter((row) => row.city_id === cityId) : rows).map((row) => ({
      id: row.id,
      cityId: row.city_id,
      slug: row.slug,
      name: row.name,
      lat: row.lat,
      lng: row.lng,
    }));
  }

  async getLatestListings(limit: number, nowIso?: string): Promise<ListingView[]> {
    const now = nowDefault(nowIso);
    const views = this.visible(await this.loadViews(), now);
    return sortListings(views, 'relevance', now).slice(0, limit);
  }

  async search(params: SearchParams, nowIso?: string) {
    const now = nowDefault(nowIso);
    const [views, universities] = await Promise.all([this.loadViews(), this.getUniversities()]);
    const filtered = filterListings(this.visible(views, now), params.filters, universities);
    const sorted = sortListings(filtered, params.sort, now);
    return paginate(sorted, { page: params.page, pageSize: params.pageSize });
  }

  async getListingViewById(listingId: string): Promise<ListingView | null> {
    const views = await this.loadViews();
    return views.find((view) => view.listing.id === listingId) ?? null;
  }

  async getListingViewBySlug(slug: string): Promise<ListingView | null> {
    const views = await this.loadViews();
    return views.find((view) => view.listing.slug === slug) ?? null;
  }

  async getListingViewsByIds(ids: string[]): Promise<ListingView[]> {
    if (ids.length === 0) return [];
    const set = new Set(ids);
    const views = await this.loadViews();
    return views.filter((view) => set.has(view.listing.id));
  }

  async getSimilarListings(listingId: string, limit: number, nowIso?: string): Promise<ListingView[]> {
    const now = nowDefault(nowIso);
    const views = this.visible(await this.loadViews(), now);
    const base = views.find((view) => view.listing.id === listingId);
    if (!base) return [];
    const similar = views.filter(
      (view) =>
        view.listing.id !== listingId &&
        view.listing.type === base.listing.type &&
        view.listing.cityId === base.listing.cityId,
    );
    return sortListings(similar, 'relevance', now).slice(0, limit);
  }

  async getNeighborhoodListings(
    neighborhoodId: string,
    excludeListingId: string,
    limit: number,
    nowIso?: string,
  ): Promise<ListingView[]> {
    if (!neighborhoodId) return [];
    const now = nowDefault(nowIso);
    const views = this.visible(await this.loadViews(), now);
    const matches = views.filter(
      (view) =>
        view.listing.id !== excludeListingId &&
        view.listing.neighborhoodId === neighborhoodId,
    );
    return sortListings(matches, 'relevance', now).slice(0, limit);
  }

  async getReportsForListing(listingId: string): Promise<Report[]> {
    const { data, error } = await supabase.from('reports').select('*').eq('listing_id', listingId);
    if (error) throw error;
    return ((data ?? []) as ReportRow[]).map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      reporterId: row.reporter_id ?? '',
      reason: row.reason as Report['reason'],
      status: row.status as Report['status'],
      resolvedBy: row.resolved_by,
      createdAt: row.created_at,
    }));
  }
}

export function createSupabaseRepository(): Repository {
  return new SupabaseRepository();
}