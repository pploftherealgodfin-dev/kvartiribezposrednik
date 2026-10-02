import { LISTING_EXPIRY } from './config';
import { addDays, diffInDays } from './date';
import type { Listing, ListingStatus } from './types';

export const LISTING_STATUSES: ListingStatus[] = [
  'draft',
  'pending_review',
  'active',
  'rented',
  'expired',
  'deactivated',
  'rejected',
  'flagged',
  'removed',
];

/** Разрешени преходи. Всичко извън тази карта е забранено. */
const TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['active', 'rejected', 'flagged'],
  active: ['rented', 'expired', 'deactivated', 'flagged', 'removed'],
  rented: ['deactivated', 'removed'],
  expired: ['pending_review', 'removed'],
  deactivated: ['pending_review', 'removed'],
  rejected: ['draft', 'pending_review'],
  flagged: ['active', 'rejected', 'removed'],
  removed: [],
};

export interface TransitionMeta {
  actorId: string;
  at?: string;
  reason?: string;
}

export interface TransitionLog {
  listingId: string;
  from: ListingStatus;
  to: ListingStatus;
  actorId: string;
  at: string;
  reason?: string;
}

export interface TransitionResult {
  ok: boolean;
  listing: Listing;
  log: TransitionLog | null;
  error?: string;
}

export function nextStatuses(from: ListingStatus): ListingStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: ListingStatus, to: ListingStatus): boolean {
  return nextStatuses(from).includes(to);
}

/** Активната обява изтича след 30 дни. */
export function computeExpiry(fromIso: string): string {
  return addDays(fromIso, LISTING_EXPIRY.activeDays);
}

/**
 * Прилага преход върху обява. Чиста функция — връща НОВ обект,
 * не мутира входа. Връща и запис за одита.
 */
export function applyTransition(
  listing: Listing,
  to: ListingStatus,
  meta: TransitionMeta,
): TransitionResult {
  if (!canTransition(listing.status, to)) {
    return {
      ok: false,
      listing,
      log: null,
      error: `Недопустим преход: ${listing.status} → ${to}`,
    };
  }

  const at = meta.at ?? new Date().toISOString();
  const next: Listing = { ...listing, status: to };

  if (to === 'active') {
    next.expiresAt = computeExpiry(at);
    next.rentedAt = null;
  }
  if (to === 'rented') {
    next.rentedAt = at;
  }
  if (to === 'removed' || to === 'expired' || to === 'deactivated') {
    next.rentedAt = to === 'removed' ? listing.rentedAt : null;
  }

  return {
    ok: true,
    listing: next,
    log: {
      listingId: listing.id,
      from: listing.status,
      to,
      actorId: meta.actorId,
      at,
      reason: meta.reason,
    },
  };
}

export function isExpired(listing: Listing, nowIso: string): boolean {
  if (listing.status !== 'active' || !listing.expiresAt) return false;
  return diffInDays(nowIso, listing.expiresAt) <= 0;
}

/** Напомняне на 25-ия ден от активния период. */
export function shouldSendExpiryReminder(listing: Listing, nowIso: string): boolean {
  if (listing.status !== 'active' || !listing.expiresAt) return false;
  const daysLeft = diffInDays(nowIso, listing.expiresAt);
  return daysLeft <= LISTING_EXPIRY.activeDays - LISTING_EXPIRY.reminderDay && daysLeft > 0;
}

/** Наетите остават видими 7 дни, после се скриват. */
export function shouldHideRented(listing: Listing, nowIso: string): boolean {
  if (listing.status !== 'rented' || !listing.rentedAt) return false;
  return diffInDays(listing.rentedAt, nowIso) >= LISTING_EXPIRY.rentedVisibleDays;
}

export function isVisibleInSearch(listing: Listing, nowIso: string): boolean {
  if (listing.status === 'active') return true;
  if (listing.status === 'rented') return !shouldHideRented(listing, nowIso);
  return false;
}