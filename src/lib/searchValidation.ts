import type { ListingFilters } from './search';
import type { City, Neighborhood, University } from './types';
export function validateSearchFilters(filters: ListingFilters, catalog?: { cities: City[]; neighborhoods: Neighborhood[]; universities: University[] }): string {
  for (const [min,max,label] of [[filters.priceMin,filters.priceMax,'цената'],[filters.areaMin,filters.areaMax,'площта'],[filters.floorMin,filters.floorMax,'етажа']] as const) {
    if (min != null && max != null && min > max) return `Началната стойност за ${label} трябва да е по-малка или равна на крайната.`;
  }
  if ([filters.priceMin,filters.priceMax,filters.areaMin,filters.areaMax].some(v => v != null && (!Number.isFinite(v) || v < 0))) return 'Цената и площта трябва да са положителни стойности или нула.';
  if ([filters.floorMin,filters.floorMax].some(v => v != null && (!Number.isInteger(v) || v < -5 || v > 200))) return 'Етажите трябва да са цели числа между −5 и 200.';
  if ((filters.rooms?.length ?? 0) > 10 || filters.rooms?.some(v => !Number.isInteger(v) || v < 1 || v > 100) || (filters.roomsMin != null && (!Number.isInteger(filters.roomsMin) || filters.roomsMin < 1 || filters.roomsMin > 100))) return 'Броят стаи трябва да е цяло число от 1 до 100; избери най-много 10 стойности.';
  if (filters.type && !['all','room','apartment','studio','house'].includes(filters.type)) return 'Непознат тип жилище. Избери тип от филтрите.';
  if ((filters.neighborhoodSlug || filters.universitySlug) && !filters.citySlug) return 'Избери град, преди да филтрираш по квартал или университет.';
  if (catalog && filters.citySlug) {
    const city = catalog.cities.find(item => item.slug === filters.citySlug);
    if (!city) return 'Градът в адреса не е намерен. Избери град от списъка.';
    if (filters.neighborhoodSlug && !catalog.neighborhoods.some(item => item.slug === filters.neighborhoodSlug && item.cityId === city.id)) return 'Кварталът не е от избрания град. Избери го от списъка.';
    if (filters.universitySlug && !catalog.universities.some(item => item.slug === filters.universitySlug && item.cityId === city.id)) return 'Учебната локация не е от избрания град. Избери я от списъка.';
  }
  if ((filters.text?.length ?? 0) > 200) return 'Текстът за търсене е ограничен до 200 знака.';
  if (filters.availableFrom) {
    const date = new Date(`${filters.availableFrom}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.availableFrom) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== filters.availableFrom) return 'Избери валидна дата за настаняване.';
  }
  return '';
}
