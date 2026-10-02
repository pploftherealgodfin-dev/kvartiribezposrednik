import { TRUST } from './config';

export type TrustBand = 'high' | 'medium' | 'low' | 'critical';
export type TrustEnforcement = 'normal' | 'manual_review' | 'auto_suspend';

/** Суровите сигнали, от които се изчислява trust score. */
export interface TrustSignals {
  phoneVerified: boolean;
  ownershipVerified: boolean;
  accountAgeDays: number;
  /** Потвърдени доклади „посредник“ (в последните 90 дни). */
  confirmedBrokerReports: number;
  /** Активни обяви без верификация. */
  unverifiedActiveListings: number;
  bannedFingerprintMatch: boolean;
  repeatedPhotosAcrossAccounts: boolean;
}

export interface TrustScoreLine {
  label: string;
  points: number;
}

export interface TrustScoreResult {
  score: number;
  lines: TrustScoreLine[];
  band: TrustBand;
  enforcement: TrustEnforcement;
}

export function trustBand(score: number): TrustBand {
  if (score >= 70) return 'high';
  if (score >= TRUST.manualReviewThreshold) return 'medium';
  if (score >= TRUST.autoSuspendThreshold) return 'low';
  return 'critical';
}

export function enforcementForScore(score: number): TrustEnforcement {
  if (score < TRUST.autoSuspendThreshold) return 'auto_suspend';
  if (score < TRUST.manualReviewThreshold) return 'manual_review';
  return 'normal';
}

/**
 * Прозрачно изчисление на trust score (0–100).
 * Правилата са само в config.ts — тази функция само ги прилага.
 */
export function computeTrustScore(signals: TrustSignals): TrustScoreResult {
  const lines: TrustScoreLine[] = [];

  if (signals.phoneVerified) {
    lines.push({ label: 'Потвърден телефон', points: TRUST.phoneVerified });
  }
  if (signals.ownershipVerified) {
    lines.push({ label: 'Потвърден документ за собственост', points: TRUST.ownershipVerified });
  }
  if (signals.accountAgeDays > TRUST.accountAgeDays) {
    lines.push({ label: 'Акаунт над 30 дни', points: TRUST.accountAgeOver30Days });
  }
  if (signals.confirmedBrokerReports === 0) {
    lines.push({ label: 'Без доклади (90 дни)', points: TRUST.noReports90Days });
  }

  if (signals.confirmedBrokerReports > 0) {
    lines.push({
      label: `Потвърдени доклади „посредник“ ×${signals.confirmedBrokerReports}`,
      points: TRUST.confirmedBrokerReport * signals.confirmedBrokerReports,
    });
  }
  if (signals.unverifiedActiveListings > 3) {
    lines.push({
      label: 'Над 3 активни обяви без верификация',
      points: TRUST.unverifiedActiveListingsOver3,
    });
  }
  if (signals.bannedFingerprintMatch) {
    lines.push({
      label: 'Съвпадение с баннат телефон/устройство',
      points: TRUST.bannedFingerprintMatch,
    });
  }
  if (signals.repeatedPhotosAcrossAccounts) {
    lines.push({
      label: 'Повтарящи се снимки между акаунти',
      points: TRUST.repeatedPhotosAcrossAccounts,
    });
  }

  const raw = lines.reduce((sum, line) => sum + line.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    lines,
    band: trustBand(score),
    enforcement: enforcementForScore(score),
  };
}