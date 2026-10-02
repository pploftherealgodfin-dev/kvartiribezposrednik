import { ANTI_BROKER, BROKER_KEYWORDS, LISTING_LIMITS } from './config';
import { hoursBetween } from './date';
import type { Ban, BanType, Listing } from './types';

export type FlagSeverity = 'info' | 'review' | 'block';

export interface AntiBrokerFlag {
  code: string;
  severity: FlagSeverity;
  message: string;
}

export interface Fingerprint {
  type: BanType;
  value: string;
}

/* ------------------------------------------------------------------ */
/* Отделни детерминистични проверки (всяка е чиста и тестваема)        */
/* ------------------------------------------------------------------ */

export function findKeywordFlags(text: string): string[] {
  const haystack = text.toLowerCase();
  return BROKER_KEYWORDS.filter((keyword) => haystack.includes(keyword));
}

/** Цена >40% над/под медианата за квартала → за преглед (само при 10+ обяви). */
export function isPriceAnomaly(
  price: number,
  median: number | null,
  sampleSize: number,
): boolean {
  if (median === null || sampleSize < ANTI_BROKER.minListingsForMedian) return false;
  if (median <= 0) return false;
  const deviation = Math.abs(price - median) / median;
  return deviation * 100 > ANTI_BROKER.priceAnomalyPercent;
}

export function isPostingVelocityExceeded(listingsLast24h: number): boolean {
  return listingsLast24h > ANTI_BROKER.velocityLimitPer24h;
}

/** true, ако собственикът е НАД разрешения лимит за активни обяви. */
export function isOverListingLimit(verified: boolean, activeCount: number): boolean {
  const limit = verified ? LISTING_LIMITS.verifiedOwnerMaxActive : LISTING_LIMITS.unverifiedOwnerMaxActive;
  return activeCount > limit;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Jaccard сходство между множествата от думи (0–1). */
export function textSimilarity(a: string, b: string): number {
  const setA = new Set(normalizeText(a).split(' ').filter(Boolean));
  const setB = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface TextCandidate {
  id: string;
  text: string;
}

export function findDuplicateTextMatches(
  text: string,
  others: TextCandidate[],
): TextCandidate[] {
  return others.filter(
    (candidate) => textSimilarity(text, candidate.text) >= ANTI_BROKER.duplicateTextSimilarity,
  );
}

export interface PhotoHashCandidate {
  id: string;
  hashes: string[];
}

export function findDuplicatePhotoMatches(
  hashes: string[],
  others: PhotoHashCandidate[],
): PhotoHashCandidate[] {
  const own = new Set(hashes.filter(Boolean));
  if (own.size === 0) return [];
  return others.filter((candidate) =>
    candidate.hashes.some((hash) => hash && own.has(hash)),
  );
}

function normalizeFingerprintValue(type: BanType, value: string): string {
  if (type === 'phone') return value.replace(/[^0-9]/g, '');
  return value.trim().toLowerCase();
}

export function matchesBan(fingerprints: Fingerprint[], bans: Ban[]): Ban | null {
  const normalized = fingerprints.map((f) => ({
    type: f.type,
    value: normalizeFingerprintValue(f.type, f.value),
  }));

  for (const ban of bans) {
    const banValue = normalizeFingerprintValue(ban.type, ban.value);
    const hit = normalized.find((f) => f.type === ban.type && f.value === banValue);
    if (hit) return ban;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Агрегатор                                                           */
/* ------------------------------------------------------------------ */

export interface AntiBrokerInput {
  listing: Pick<Listing, 'id' | 'title' | 'description' | 'priceEur' | 'createdAt' | 'ownerId'>;
  owner: { verified: boolean; activeListingCount: number };
  /** Други обяви от ДРУГИ собственици (за дубликати). */
  otherOwnersListings: {
    id: string;
    ownerId: string;
    text: string;
    hashes: string[];
  }[];
  neighborhoodMedian: { median: number; sampleSize: number } | null;
  listingsLast24h: number;
  fingerprints: Fingerprint[];
  bans: Ban[];
  nowIso: string;
}

export interface AntiBrokerResult {
  flags: AntiBrokerFlag[];
  decision: 'approve' | 'review' | 'block';
}

export function runAntiBrokerChecks(input: AntiBrokerInput): AntiBrokerResult {
  const flags: AntiBrokerFlag[] = [];

  const keywords = findKeywordFlags(`${input.listing.title} ${input.listing.description}`);
  if (keywords.length > 0) {
    flags.push({
      code: 'keyword_flag',
      severity: 'review',
      message: `Открити ключови думи на посредник: ${keywords.join(', ')}`,
    });
  }

  if (isOverListingLimit(input.owner.verified, input.owner.activeListingCount)) {
    flags.push({
      code: 'listing_limit',
      severity: 'review',
      message: 'Надвишен лимит активни обяви за този тип собственик.',
    });
  }

  if (isPostingVelocityExceeded(input.listingsLast24h)) {
    flags.push({
      code: 'posting_velocity',
      severity: 'review',
      message: `Повече от ${ANTI_BROKER.velocityLimitPer24h} обяви за 24 часа.`,
    });
  }

  if (isPriceAnomaly(input.listing.priceEur, input.neighborhoodMedian?.median ?? null, input.neighborhoodMedian?.sampleSize ?? 0)) {
    flags.push({
      code: 'price_anomaly',
      severity: 'review',
      message: 'Цената се отклонява значително от медианата за квартала.',
    });
  }

  const ownText = `${input.listing.title} ${input.listing.description}`;
  const textMatches = findDuplicateTextMatches(
    ownText,
    input.otherOwnersListings.map((l) => ({ id: l.id, text: l.text })),
  );
  if (textMatches.length > 0) {
    flags.push({
      code: 'duplicate_text',
      severity: 'review',
      message: 'Описанието е твърде сходно с обява на друг собственик.',
    });
  }

  // Снимките са на ниво listing по-горе; тук сравняваме хешове от списъка.
  const ownPhotoHolder = input.otherOwnersListings.find((l) => l.id === input.listing.id);
  if (ownPhotoHolder) {
    const photoMatches = findDuplicatePhotoMatches(ownPhotoHolder.hashes, input.otherOwnersListings);
    if (photoMatches.length > 0) {
      flags.push({
        code: 'duplicate_photos',
        severity: 'review',
        message: 'Снимките съвпадат със снимки от обява на друг акаунт.',
      });
    }
  }

  const ban = matchesBan(input.fingerprints, input.bans);
  if (ban) {
    flags.push({
      code: 'fingerprint_ban',
      severity: 'block',
      message: `Съвпадение с баннат ${ban.type}: ${ban.reason}`,
    });
  }

  let decision: AntiBrokerResult['decision'] = 'approve';
  if (flags.some((f) => f.severity === 'block')) decision = 'block';
  else if (flags.some((f) => f.severity === 'review')) decision = 'review';

  return { flags, decision };
}

/** Помощна: колко обяви е публикувал даден собственик за последните 24ч. */
export function countRecentListings(
  listings: Pick<Listing, 'ownerId' | 'createdAt'>[],
  ownerId: string,
  nowIso: string,
): number {
  return listings.filter(
    (l) => l.ownerId === ownerId && hoursBetween(l.createdAt, nowIso) <= 24,
  ).length;
}