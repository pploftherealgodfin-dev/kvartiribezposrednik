import { normalizeText } from './antiBroker';
import { sortListings, type SortKey } from './ranking';
import type { ListingType, ListingView, University } from './types';

export interface ListingFilters {
  citySlug?: string;
  neighborhoodSlug?: string;
  universitySlug?: string;
  type?: ListingType | 'all';
  priceMin?: number | null;
  priceMax?: number | null;
  rooms?: number[];
  /** Долна граница за стаи (за опцията „4+“). */
  roomsMin?: number | null;
  areaMin?: number | null;
  areaMax?: number | null;
  floorMin?: number | null;
  floorMax?: number | null;
  furnished?: boolean;
  petsAllowed?: boolean;
  availableFrom?: string | null;
  text?: string;
}

export const EMPTY_FILTERS: ListingFilters = {
  type: 'all',
  rooms: [],
};

export function filterListings(
  views: ListingView[],
  filters: ListingFilters,
  universities: University[] = [],
): ListingView[] {
  const university = filters.universitySlug
    ? universities.find((u) => u.slug === filters.universitySlug)
    : undefined;

  return views.filter(({ listing, city, neighborhood }) => {
    if (filters.citySlug && city.slug !== filters.citySlug) return false;
    if (filters.neighborhoodSlug && neighborhood?.slug !== filters.neighborhoodSlug) return false;
    if (filters.type && filters.type !== 'all' && listing.type !== filters.type) return false;

    if (filters.priceMin != null && listing.priceEur < filters.priceMin) return false;
    if (filters.priceMax != null && listing.priceEur > filters.priceMax) return false;

    const hasRoomFilter = (filters.rooms && filters.rooms.length > 0) || filters.roomsMin != null;
    if (hasRoomFilter) {
      const matchesExact = Boolean(filters.rooms && filters.rooms.includes(listing.rooms));
      const matchesMin = filters.roomsMin != null && listing.rooms >= filters.roomsMin;
      if (!matchesExact && !matchesMin) return false;
    }

    if (filters.areaMin != null && listing.areaM2 < filters.areaMin) return false;
    if (filters.areaMax != null && listing.areaM2 > filters.areaMax) return false;

    if (filters.floorMin != null && (listing.floor == null || listing.floor < filters.floorMin)) return false;
    if (filters.floorMax != null && (listing.floor == null || listing.floor > filters.floorMax)) return false;

    if (filters.furnished != null && listing.furnished !== filters.furnished) return false;
    if (filters.petsAllowed != null && listing.petsAllowed !== filters.petsAllowed) return false;

    if (filters.availableFrom) {
      if (new Date(listing.availableFrom).getTime() > new Date(filters.availableFrom).getTime()) {
        return false;
      }
    }

    if (filters.universitySlug && (!university || !listing.nearbyUniversityIds.includes(university.id))) return false;

    if (filters.text && filters.text.trim().length > 0) {
      const haystack = normalizeText(
        `${listing.title} ${listing.description} ${neighborhood?.name ?? ''} ${city.name}`,
      );
      const needle = normalizeText(filters.text);
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

export function searchListings(
  views: ListingView[],
  filters: ListingFilters,
  sort: SortKey,
  nowIso: string,
  universities: University[] = [],
): ListingView[] {
  return sortListings(filterListings(views, filters, universities), sort, nowIso);
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginate<T>(items: T[], { page, pageSize }: Pagination): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}
