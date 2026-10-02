import { REPORTING } from './config';
import type { Report } from './types';

/** Колко различни потребители са докладвали. */
export function distinctReporterCount(
  reports: Pick<Report, 'reporterId'>[],
): number {
  return new Set(reports.map((r) => r.reporterId)).size;
}

/** 3 различни докладващи автоматично скриват обявата за преглед. */
export function shouldAutoHide(reports: Pick<Report, 'reporterId'>[]): boolean {
  return distinctReporterCount(reports) >= REPORTING.distinctReportersToAutoHide;
}

/**
 * Докладването от един и същ потребител многократно намалява
 * неговата достоверност като докладващ (anti-abuse).
 */
export function adjustReporterCredibility(
  current: number,
  outcome: { confirmed: number; dismissed: number },
): number {
  const next = current + outcome.confirmed * 5 - outcome.dismissed * 10;
  return Math.max(0, Math.min(100, next));
}