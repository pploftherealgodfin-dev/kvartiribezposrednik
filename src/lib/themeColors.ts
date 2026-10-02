import { useMemo } from 'react';

/**
 * Разчита цветовете на палитрата от CSS променливите, за да могат
 * библиотеки за графики (които искат конкретен цвят, не CSS клас)
 * да останат свързани с дизайн системата.
 */
export interface ThemeColors {
  primary: string;
  accent: string;
  secondary: string;
  foreground: string;
  grid: string;
  surface: string;
}

function readColor(variable: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return raw ? `oklch(${raw})` : fallback;
}

export function useThemeColors(): ThemeColors {
  return useMemo<ThemeColors>(
    () => ({
      primary: readColor('--primary-500', 'oklch(0.46 0.088 156)'),
      accent: readColor('--accent-500', 'oklch(0.76 0.122 85)'),
      secondary: readColor('--secondary-500', 'oklch(0.625 0.011 85)'),
      foreground: readColor('--foreground-600', 'oklch(0.415 0.01 80)'),
      grid: readColor('--background-300', 'oklch(0.9 0.013 92)'),
      surface: readColor('--background-50', 'oklch(0.986 0.007 92)'),
    }),
    [],
  );
}