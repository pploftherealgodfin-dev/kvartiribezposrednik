import { CONTACT } from './config';
import { diffInDays } from './date';
import type { PhoneReveal } from './types';

export interface RevealState {
  revealsToday: number;
}

export function canRevealPhone(state: RevealState): boolean {
  return state.revealsToday < CONTACT.phoneRevealsPerDay;
}

export function remainingReveals(state: RevealState): number {
  return Math.max(0, CONTACT.phoneRevealsPerDay - state.revealsToday);
}

export function countRevealsToday(
  reveals: Pick<PhoneReveal, 'viewerId' | 'createdAt'>[],
  viewerId: string,
  nowIso: string,
): number {
  const dayStart = new Date(nowIso);
  dayStart.setHours(0, 0, 0, 0);
  return reveals.filter(
    (r) => r.viewerId === viewerId && new Date(r.createdAt).getTime() >= dayStart.getTime(),
  ).length;
}

/** Новите акаунти имат лимит за нови разговори на ден (анти-спам). */
export function canStartConversation(
  accountCreatedAt: string,
  conversationsToday: number,
  nowIso: string,
): boolean {
  const ageDays = diffInDays(accountCreatedAt, nowIso);
  if (ageDays >= CONTACT.newAccountMaxAgeDays) return true;
  return conversationsToday < CONTACT.newAccountConversationsPerDay;
}