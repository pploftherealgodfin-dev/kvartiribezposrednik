import { QUALITY } from './config';
import type { Listing } from './types';

export interface QualityResult {
  /** Събрани точки. */
  score: number;
  /** Максимум точки. */
  max: number;
  /** Процент 0–100 за прогрес бар. */
  percent: number;
  /** Липсващи елементи, с човешки текст за собственика. */
  missing: string[];
}

const MESSAGES: Record<string, string> = {
  photos: `Добави поне ${QUALITY.minPhotos} снимки`,
  floor: 'Посочи етаж',
  deposit: 'Посочи депозит',
  description: `Напиши по-подробно описание (поне ${QUALITY.descriptionGoodLength} знака)`,
  address: 'Посочи адрес (скрит за публиката)',
  area: 'Посочи квадратура',
  rooms: 'Посочи брой стаи',
  furnishing: 'Уточни обзавеждане',
  availableFrom: 'Посочи свободна от дата',
  totalFloors: 'Посочи общ брой етажи',
};

/**
 * Показва на собственика колко „пълна“ е обявата му,
 * за да го насърчи да въведе качествени данни.
 */
export function computeListingQuality(listing: Partial<Listing>): QualityResult {
  const p = QUALITY.points;
  let score = 0;
  const missing: string[] = [];

  if ((listing.photos?.length ?? 0) >= QUALITY.minPhotos) {
    score += p.photos;
  } else {
    missing.push(MESSAGES.photos);
  }

  if (listing.floor !== null && listing.floor !== undefined) score += p.floor;
  else missing.push(MESSAGES.floor);

  if (listing.deposit !== null && listing.deposit !== undefined) score += p.deposit;
  else missing.push(MESSAGES.deposit);

  if ((listing.description?.trim().length ?? 0) >= QUALITY.descriptionGoodLength) {
    score += p.description;
  } else {
    missing.push(MESSAGES.description);
  }

  if (listing.addressPrivate && listing.addressPrivate.trim().length > 0) score += p.address;
  else missing.push(MESSAGES.address);

  if (listing.areaM2 && listing.areaM2 > 0) score += p.area;
  else missing.push(MESSAGES.area);

  if (listing.rooms && listing.rooms > 0) score += p.rooms;
  else missing.push(MESSAGES.rooms);

  if (typeof listing.furnished === 'boolean') score += p.furnishing;
  else missing.push(MESSAGES.furnishing);

  if (listing.availableFrom) score += p.availableFrom;
  else missing.push(MESSAGES.availableFrom);

  if (listing.totalFloors !== null && listing.totalFloors !== undefined) score += p.totalFloors;
  else missing.push(MESSAGES.totalFloors);

  const max = Object.values(p).reduce((sum, value) => sum + value, 0);
  const percent = max === 0 ? 0 : Math.round((score / max) * 100);

  return { score, max, percent, missing };
}