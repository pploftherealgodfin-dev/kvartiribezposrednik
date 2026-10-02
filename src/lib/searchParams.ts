import type { ListingFilters } from './search';
import type { ListingType } from './types';

export interface SearchFilterValues {
  citySlug: string; neighborhoodSlug: string; universitySlug: string; type: string;
  rooms: string; priceMin: string; priceMax: string; areaMin: string; areaMax: string;
  floorMin: string; floorMax: string; furnished: string; pets: string; availableFrom: string; text: string;
}
export const FIELD_PARAM: Record<keyof SearchFilterValues, string> = {
  citySlug: 'grad', neighborhoodSlug: 'kvartal', universitySlug: 'universitet', type: 'tip',
  rooms: 'stai', priceMin: 'cena-ot', priceMax: 'cena-do', areaMin: 'plosht-ot', areaMax: 'plosht-do',
  floorMin: 'etazh-ot', floorMax: 'etazh-do', furnished: 'obzavedena', pets: 'domashni', availableFrom: 'ot', text: 't',
};
export function parseValues(params: URLSearchParams): SearchFilterValues {
  return Object.fromEntries(Object.entries(FIELD_PARAM).map(([field, param]) => [field, params.get(param) ?? (field === 'type' ? 'all' : '')])) as unknown as SearchFilterValues;
}
function number(value: string): number | null {
  if (!value) return null;
  // Invalid values must remain invalid; silently dropping them broadens the search.
  return /^-?(?:\d+|\d*\.\d+)$/.test(value.trim()) ? Number(value) : NaN;
}
export function parseFilters(params: URLSearchParams): ListingFilters {
  const values = parseValues(params);
  const tokens = values.rooms.split(',').filter(Boolean);
  return {
    citySlug: values.citySlug || undefined, neighborhoodSlug: values.neighborhoodSlug || undefined,
    universitySlug: values.universitySlug || undefined, type: values.type as ListingType | 'all',
    priceMin: number(values.priceMin), priceMax: number(values.priceMax),
    areaMin: number(values.areaMin), areaMax: number(values.areaMax),
    floorMin: number(values.floorMin), floorMax: number(values.floorMax),
    rooms: [...new Set(tokens.filter(token => token !== '4+').map(token => number(token) ?? NaN))],
    roomsMin: tokens.includes('4+') ? 4 : null,
    furnished: values.furnished === '1' ? true : values.furnished === '0' ? false : undefined,
    petsAllowed: values.pets === '1' ? true : values.pets === '0' ? false : undefined,
    availableFrom: values.availableFrom || null, text: values.text.trim() || undefined,
  };
}
export function validateSearchParams(params: URLSearchParams): string {
  if (['obzavedena', 'domashni'].some(key => !['', '0', '1'].includes(params.get(key) ?? ''))) return 'Избери валидна стойност за обзавеждане и домашни любимци.';
  if (Object.values(FIELD_PARAM).some(key => params.getAll(key).length > 1)) return 'Един филтър е повторен в адреса. Изчисти филтрите и опитай отново.';
  return '';
}
