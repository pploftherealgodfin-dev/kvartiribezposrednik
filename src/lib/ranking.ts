import { RANKING } from './config';
import { diffInDays } from './date';
import { computeListingQuality } from './qualityScore';
import type { ListingView } from './types';

export type SortKey = 'relevance' | 'newest' | 'cheapest' | 'pricePerM2';

export const SORT_KEYS: SortKey[] = ['relevance', 'newest', 'cheapest', 'pricePerM2'];

function freshnessScore(createdAt: string, nowIso: string): number {
  const ageDays = Math.max(0, diffInDays(createdAt, nowIso));
  if (ageDays >= RANKING.freshnessWindowDays) return 0;
  return RANKING.freshnessMax * (1 - ageDays / RANKING.freshnessWindowDays);
}

/**
 * Релевантност: верифициран собственик първо, после по-нови обяви,
 * подсилени от пълнотата на обявата. Наетите падат надолу.
 */
export function relevanceScore(view: ListingView, nowIso: string): number {
  const { listing, badges } = view;
  let score = 0;

  if (badges.verifiedOwner) score += RANKING.verifiedOwnerBoost;
  score += freshnessScore(listing.createdAt, nowIso);

  const quality = computeListingQuality(listing);
  score += quality.percent * RANKING.qualityWeight;

  if (badges.isNew) score += RANKING.newBadgeBoost;
  if (badges.isRented) score -= RANKING.rentedPenalty;

  return score;
}

export function sortListings(
  views: ListingView[],
  sort: SortKey,
  nowIso: string,
): ListingView[] {
  const copy = [...views];

  switch (sort) {
    case 'newest':
      return copy.sort(
        (a, b) => new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime(),
      );
    case 'cheapest':
      return copy.sort((a, b) => a.listing.priceEur - b.listing.priceEur);
    case 'pricePerM2':
      return copy.sort(
        (a, b) =>
          a.listing.priceEur / (a.listing.areaM2 || 1) -
          b.listing.priceEur / (b.listing.areaM2 || 1),
      );
    case 'relevance':
    default:
      return copy.sort((a, b) => relevanceScore(b, nowIso) - relevanceScore(a, nowIso));
  }
}