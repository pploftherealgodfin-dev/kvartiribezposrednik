import { referenceCache } from '@/lib/referenceCache';
import { signPhotoPaths } from '@/lib/photoAccess';
import { LISTING_EXPIRY } from '@/lib/config';
import { diffInDays } from '@/lib/date';
import { isVisibleInSearch } from '@/lib/listingStateMachine';
import { sortListings } from '@/lib/ranking';
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
  nearby_university_ids: string[];
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
  region?: string;
  ekatte?: string;
  is_university_city?: boolean;
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

interface NeighborhoodRow extends CityRow {
  association_method?: string;
  source_url?: string;
  city_id: string;
}

interface UniversityRow extends CityRow {
  kind?: 'institution' | 'branch';
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
  return { id: row.id, slug: row.slug, name: row.name, lat: row.lat, lng: row.lng, region: row.region, ekatte: row.ekatte, isUniversityCity: row.is_university_city };
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
    nearbyUniversityIds: row.nearby_university_ids ?? [],
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
  private async loadViews(filter?: { ids?: string[]; slug?: string; neighborhoodId?: string; cityId?: string; type?: string; excludeId?: string; limit?: number; publicOnly?: boolean }): Promise<ListingView[]> {
    const { data: { session } } = await supabase.auth.getSession();
    let query = supabase.from('listings').select('id,slug,owner_id,type,status,title,description,price_eur,deposit,area_m2,rooms,floor,total_floors,furnished,pets_allowed,utilities_included,available_from,min_term_months,city_id,neighborhood_id,nearby_university_ids,lat_approx,lng_approx,created_at,expires_at,rented_at,ownership_verified_at,verification_expires_at,verification_method,photos:listing_photos(id,listing_id,storage_path,position,phash)');
    if (filter?.ids) query = query.in('id', filter.ids);
    if (filter?.slug) query = query.eq('slug', filter.slug);
    if (filter?.neighborhoodId) query = query.eq('neighborhood_id', filter.neighborhoodId);
    if (filter?.cityId) query = query.eq('city_id', filter.cityId);
    if (filter?.type) query = query.eq('type', filter.type);
    if (filter?.excludeId) query = query.neq('id', filter.excludeId);
    if (filter?.publicOnly) query = query.eq('status', 'active').gt('expires_at', new Date().toISOString());
    query = query.order('created_at', { ascending: false }).limit(filter?.limit ?? 50);
    const listingsResult = await query;
    if (listingsResult.error) throw listingsResult.error;
    if (!listingsResult.data?.length) return [];
    const neighborhoodIds = [...new Set(listingsResult.data.map(row => row.neighborhood_id).filter(Boolean))];
    const [citiesResult, neighborhoodsResult] = await Promise.all([
      this.getCities().then(items => ({ data: items.map(item => ({ ...item, is_university_city: item.isUniversityCity })), error: null })),
      neighborhoodIds.length ? supabase.from('neighborhoods').select('id,city_id,slug,name,lat,lng').in('id', neighborhoodIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (citiesResult.error) throw citiesResult.error;
    if (neighborhoodsResult.error) throw neighborhoodsResult.error;
    const ownerIds = [...new Set((listingsResult.data ?? []).map(row => row.owner_id))];
    const profilesResult = session && ownerIds.length ? await supabase.from('profiles').select('id,name,owner_verified,created_at').in('id', ownerIds) : { data: [], error: null };
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
    return referenceCache('cities',async()=>{
    const { data, error } = await supabase.from('cities').select('*');
    if (error) throw error;
    return ((data ?? []) as CityRow[]).map(mapCity).sort((a,b) => Number(b.isUniversityCity) - Number(a.isUniversityCity) || a.name.localeCompare(b.name,'bg') || (a.region ?? '').localeCompare(b.region ?? '', 'bg'));
      });
  }

  async getNeighborhoods(cityId?: string): Promise<Neighborhood[]> {
    const items = await referenceCache('neighborhoods/' + (cityId ?? 'all'),async()=>{
    const rows: NeighborhoodRow[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase.from('neighborhoods').select('*').order('id').range(offset, offset + 999);
      if (cityId) query = query.eq('city_id', cityId);
      const { data, error } = await query;
      if (error) throw error;
      rows.push(...(data ?? []) as NeighborhoodRow[]);
      if ((data?.length ?? 0) < 1000) break;
    }
    return rows.map(row => ({ id: row.id, cityId: row.city_id, slug: row.slug, name: row.name, lat: row.lat, lng: row.lng, associationMethod: row.association_method, sourceUrl: row.source_url })).sort((a,b) => a.name.localeCompare(b.name,'bg'));
      });
    return cityId ? items.filter(item=>item.cityId===cityId) : items;
  }

  async getUniversities(cityId?: string): Promise<University[]> {
    const items = await referenceCache('universities/' + (cityId ?? 'all'),async()=>{
    let query = supabase.from('universities').select('*');
    if (cityId) query = query.eq('city_id', cityId);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as UniversityRow[];
    return rows.map((row) => ({
      id: row.id,
      cityId: row.city_id,
      kind: row.kind,
      slug: row.slug,
      name: row.name,
      lat: row.lat,
      lng: row.lng,
    }));
      });
    return cityId ? items.filter(item=>item.cityId===cityId) : items;
  }

  async getLatestListings(limit: number, nowIso?: string): Promise<ListingView[]> {
    const now = nowDefault(nowIso);
    const views = this.visible(await this.loadViews({ publicOnly: true, limit }), now);
    return sortListings(views, 'relevance', now).slice(0, limit);
  }

  async search(params: SearchParams, _nowIso?: string) {
    const { data, error } = await supabase.rpc('search_listing_ids', { p_filters: params.filters, p_sort: params.sort, p_page: params.page, p_size: params.pageSize });
    if (error) throw error;
    const result = data as { ids: string[]; total: number; page: number };
    const views = result.ids.length ? await this.loadViews({ ids: result.ids, limit: params.pageSize }) : [];
    const map = new Map(views.map(view => [view.listing.id, view]));
    return { items: result.ids.map(id => map.get(id)).filter((view): view is ListingView => Boolean(view)), total: result.total, page: result.page, pageSize: params.pageSize, totalPages: Math.max(1, Math.ceil(result.total / params.pageSize)) };
  }

  async getListingViewById(listingId: string): Promise<ListingView | null> {
    const views = await this.loadViews({ ids: [listingId], limit: 1 });
    return views.find((view) => view.listing.id === listingId) ?? null;
  }

  async getListingViewBySlug(slug: string): Promise<ListingView | null> {
    const views = await this.loadViews({ slug, limit: 1 });
    return views.find((view) => view.listing.slug === slug) ?? null;
  }

  async getListingViewsByIds(ids: string[]): Promise<ListingView[]> {
    if (ids.length === 0) return [];
    const set = new Set(ids);
    const views = await this.loadViews({ ids, limit: Math.min(ids.length, 500) });
    return views.filter((view) => set.has(view.listing.id));
  }

  async getSimilarListings(listingId: string, limit: number, nowIso?: string): Promise<ListingView[]> {
    const now = nowDefault(nowIso);
    const base = await this.getListingViewById(listingId);
    if (!base) return [];
    const views = this.visible(await this.loadViews({ publicOnly: true, cityId: base.city.id, type: base.listing.type, excludeId: listingId, limit }), now);
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
    const views = this.visible(await this.loadViews({ publicOnly: true, neighborhoodId, excludeId: excludeListingId, limit }), now);
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
