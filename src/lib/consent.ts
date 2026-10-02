/**
 * GDPR + ePrivacy: управление на съгласието за бисквитки.
 * Съхранението е в localStorage (кратко, структурирано — допустимо по правилата).
 */

export type ConsentCategory = 'analytics' | 'marketing';

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: string;
  updatedAt: string;
}

export const CONSENT_VERSION = '1.0.0';
export const CONSENT_STORAGE_KEY = 'kpn.consent';
export const CONSENT_OPEN_EVENT = 'kpn:open-consent';

export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
  updatedAt: '',
};

/** Чете записаното съгласие. Връща null, ако липсва или версията е остаряла. */
export function readConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      version: CONSENT_VERSION,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

/** Записва избор на потребителя. */
export function saveConsent(choice: {
  analytics: boolean;
  marketing: boolean;
}): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* съхранението може да е блокирано — не блокираме приложението */
  }
  return state;
}

export function hasStoredConsent(): boolean {
  return readConsent() !== null;
}

/** Отваря панела за настройки от всяко място в сайта (футър, политика за бисквитки). */
export function openConsentSettings(): void {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}