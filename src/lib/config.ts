/**
 * Единно място за всички прагове и константи на бизнес логиката.
 * Промяна на поведението на системата става ТУК, без да се пипа логиката.
 */

export const CURRENCY = {
  code: 'EUR',
  symbol: '€',
} as const;

/** Trust score тежести (0–100). */
export const TRUST = {
  phoneVerified: 20,
  ownershipVerified: 30,
  accountAgeOver30Days: 10,
  noReports90Days: 10,
  confirmedBrokerReport: -25,
  unverifiedActiveListingsOver3: -15,
  bannedFingerprintMatch: -20,
  repeatedPhotosAcrossAccounts: -10,
  /** Под този праг обявите отиват на ръчен преглед. */
  manualReviewThreshold: 30,
  /** Под този праг акаунтът се спира автоматично. */
  autoSuspendThreshold: 10,
  /** Прозорец за „без доклади“. */
  noReportsWindowDays: 90,
  /** Праг на възрастта на акаунта. */
  accountAgeDays: 30,
} as const;

/** Лимити за активни обяви според верификацията. */
export const LISTING_LIMITS = {
  unverifiedOwnerMaxActive: 2,
  verifiedOwnerMaxActive: 10,
} as const;

/** Жизнен цикъл на обявата. */
export const LISTING_EXPIRY = {
  activeDays: 30,
  reminderDay: 25,
  rentedVisibleDays: 7,
  /** „Нова“ значка. */
  newBadgeDays: 7,
} as const;

/** Докладване. */
export const REPORTING = {
  distinctReportersToAutoHide: 3,
} as const;

/** Детерминистични anti-broker правила. */
export const ANTI_BROKER = {
  priceAnomalyPercent: 40,
  minListingsForMedian: 10,
  velocityLimitPer24h: 3,
  duplicateTextSimilarity: 0.82,
} as const;

/** Защита на контакти и съобщения. */
export const CONTACT = {
  phoneRevealsPerDay: 30,
  newAccountConversationsPerDay: 10,
  newAccountMaxAgeDays: 14,
} as const;

export const GEO = {
  universityNearbyKm: 3,
} as const;

/** Ранкиране на резултатите. */
export const RANKING = {
  verifiedOwnerBoost: 100,
  freshnessMax: 50,
  freshnessWindowDays: 30,
  qualityWeight: 0.5,
  newBadgeBoost: 10,
  rentedPenalty: 500,
} as const;

/** Качество на обявата (completeness). */
export const QUALITY = {
  minPhotos: 3,
  maxPhotos: 15,
  descriptionGoodLength: 200,
  points: {
    photos: 25,
    floor: 10,
    deposit: 10,
    description: 20,
    address: 10,
    area: 5,
    rooms: 5,
    furnishing: 5,
    availableFrom: 5,
    totalFloors: 5,
  },
} as const;

/** Ключови думи, които изпращат обява на ръчен преглед. */
export const BROKER_KEYWORDS = [
  'комисионна',
  'агенция',
  'оглед срещу такса',
  'ексклузивно',
  'имоти',
  'брокер',
  'посредник',
] as const;

/** Страници за пагинация. */
export const PAGINATION = {
  pageSize: 12,
} as const;