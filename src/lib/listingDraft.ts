import type { City, Neighborhood, University, ListingType } from './types';
import type { NewListingInput } from './repository/owner';
export interface ListingDraft {
  cityId: string; neighborhoodId: string; universityIds: string[]; type: ListingType;
  title: string; description: string; price: string; area: string; rooms: string;
  floor: string; totalFloors: string; deposit: string; availableFrom: string;
  furnished: boolean; pets: boolean; utilities: boolean;
}
export interface DraftIssue { step: number; field: string; message: string }
export function validateListingDraft(draft: ListingDraft, step: number, cities: City[], neighborhoods: Neighborhood[], universities: University[], photoCount: number): DraftIssue | null {
  const issue = (field: string, message: string) => ({ step, field, message });
  if (step === 0) {
    if (!cities.some(city => city.id === draft.cityId)) return issue('nf-city', 'Избери град от списъка.');
    if (draft.neighborhoodId && !neighborhoods.some(item => item.id === draft.neighborhoodId && item.cityId === draft.cityId)) return issue('nf-neighborhood', 'Кварталът трябва да е в избрания град.');
    if (draft.universityIds.length > 3 || new Set(draft.universityIds).size !== draft.universityIds.length || draft.universityIds.some(id => !universities.some(item => item.id === id && item.cityId === draft.cityId))) return issue('nf-university', 'Избери до 3 учебни локации в същия град.');
  }
  if (step === 1) {
    if (draft.title.trim().length < 5 || draft.title.trim().length > 120) return issue('nf-title', 'Заглавието трябва да е между 5 и 120 знака.');
    if (draft.description.trim().length < 30 || draft.description.trim().length > 5000) return issue('nf-description', 'Добави описание между 30 и 5000 знака.');
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(draft.title + ' ' + draft.description) || /(\+?359|00359|0)[ -]?[0-9]([ ()-]*[0-9]){7,8}/.test(draft.title + ' ' + draft.description)) return issue('nf-description', 'Телефонът и имейлът се настройват отделно и са видими след вход. Премахни ги от публичния текст.');
    if (!['apartment','room','studio','house'].includes(draft.type)) return issue('nf-type', 'Избери тип жилище.');
    for (const [field, value, label] of [['nf-price', draft.price, 'наем'], ['nf-area', draft.area, 'площ']]) if (!value || !Number.isFinite(Number(value)) || Number(value) < 0.01) return issue(field, 'Въведи положителна стойност за ' + label + '.');
    if (Number(draft.price) > 99_999_999.99 || Math.round(Number(draft.price)*100)/100 !== Number(draft.price)) return issue('nf-price', 'Наемът може да е до 99 999 999,99 € и до 2 знака след десетичната запетая.');
    if (Number(draft.area) > 999_999.99 || Math.round(Number(draft.area)*100)/100 !== Number(draft.area)) return issue('nf-area', 'Площта може да е до 999 999,99 m² и до 2 знака след десетичната запетая.');
    if (!Number.isInteger(Number(draft.rooms)) || Number(draft.rooms) < 1 || Number(draft.rooms) > 100) return issue('nf-rooms', 'Стаите трябва да са цяло число от 1 до 100.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.availableFrom) || Number.isNaN(Date.parse(draft.availableFrom)) || new Date(draft.availableFrom).toISOString().slice(0,10) !== draft.availableFrom) return issue('nf-available', 'Избери валидна дата за нанасяне.');
    if (draft.deposit && (!Number.isFinite(Number(draft.deposit)) || Number(draft.deposit) < 0 || Number(draft.deposit) > 99_999_999.99 || Math.round(Number(draft.deposit)*100)/100 !== Number(draft.deposit))) return issue('nf-deposit', 'Депозитът трябва да е 0 или положителна сума до 99 999 999,99 €, с до 2 знака след десетичната запетая.');
    if (draft.floor && (!Number.isInteger(Number(draft.floor)) || Number(draft.floor) < -5 || Number(draft.floor) > 200)) return issue('nf-floor', 'Провери етажа.');
    if (draft.totalFloors && (!Number.isInteger(Number(draft.totalFloors)) || Number(draft.totalFloors) < 1 || Number(draft.totalFloors) > 200 || (draft.floor && Number(draft.floor) > Number(draft.totalFloors)))) return issue('nf-total-floors', 'Общите етажи не могат да са по-малко от етажа на жилището.');
  }
  if (step === 2 && (photoCount < 1 || photoCount > 15)) return issue('nf-photos', 'Добави между 1 и 15 реални снимки на жилището.');
  return null;
}
export function toListingInput(draft: ListingDraft): NewListingInput {
  return { title: draft.title.trim(), description: draft.description.trim(), type: draft.type, priceEur: Number(draft.price), areaM2: Number(draft.area), rooms: Number(draft.rooms), cityId: draft.cityId, neighborhoodId: draft.neighborhoodId || null, nearbyUniversityIds: draft.universityIds, availableFrom: draft.availableFrom, deposit: draft.deposit === '' ? null : Number(draft.deposit), floor: draft.floor === '' ? null : Number(draft.floor), totalFloors: draft.totalFloors === '' ? null : Number(draft.totalFloors), furnished: draft.furnished, petsAllowed: draft.pets, utilitiesIncluded: draft.utilities };
}
