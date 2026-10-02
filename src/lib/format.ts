/**
 * Форматиране на стойности за показване.
 * От 2026 г. България е в еврозоната — цените се показват само в евро (EUR).
 */

export function formatEur(value: number): string {
  const formatted = new Intl.NumberFormat('bg-BG', {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} €`;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('bg-BG', {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatArea(m2: number): string {
  return `${formatNumber(m2, 1)} м²`;
}

export function pricePerM2(priceEur: number, areaM2: number): number {
  if (!areaM2 || areaM2 <= 0) return 0;
  return Math.round(priceEur / areaM2);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('bg-BG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}