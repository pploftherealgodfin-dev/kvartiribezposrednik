/**
 * Малки, чисти помощни функции за дати. Без външни зависимости,
 * за да са лесни за unit тестване.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(fromIso: string, days: number): string {
  return new Date(new Date(fromIso).getTime() + days * MS_PER_DAY).toISOString();
}

export function diffInDays(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY;
}

export function hoursBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / (60 * 60 * 1000);
}

export function isAfter(aIso: string, bIso: string): boolean {
  return new Date(aIso).getTime() > new Date(bIso).getTime();
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}