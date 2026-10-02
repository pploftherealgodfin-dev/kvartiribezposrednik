import type { SortKey } from '../ranking';
import type { ListingFilters, PaginatedResult } from '../search';
import type { City, ListingView, Neighborhood, Report, University } from '../types';

export interface SearchParams {
  filters: ListingFilters;
  sort: SortKey;
  page: number;
  pageSize: number;
}

/**
 * Единственият вход към данните. Днес е mock, утре — Supabase.
 * Страниците никога не говорят директно с базата, само с този интерфейс.
 */
export interface Repository {
  getCities(): Promise<City[]>;
  getNeighborhoods(cityId?: string): Promise<Neighborhood[]>;
  getUniversities(cityId?: string): Promise<University[]>;

  getLatestListings(limit: number, nowIso?: string): Promise<ListingView[]>;
  search(params: SearchParams, nowIso?: string): Promise<PaginatedResult<ListingView>>;

  getListingViewById(listingId: string): Promise<ListingView | null>;
  getListingViewBySlug(slug: string): Promise<ListingView | null>;
  getListingViewsByIds(ids: string[]): Promise<ListingView[]>;
  getSimilarListings(listingId: string, limit: number, nowIso?: string): Promise<ListingView[]>;
  getNeighborhoodListings(
    neighborhoodId: string,
    excludeListingId: string,
    limit: number,
    nowIso?: string,
  ): Promise<ListingView[]>;

  getReportsForListing(listingId: string): Promise<Report[]>;
}