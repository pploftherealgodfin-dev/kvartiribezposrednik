import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CONSENT_OPEN_EVENT, readConsent, saveConsent } from '@/lib/consent';

interface ConsentSwitchProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}

function ConsentSwitch({ checked, disabled, label, onChange }: ConsentSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-background-300'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full border border-background-300 bg-background-50 transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!readConsent()) setVisible(true);

    const handleOpen = () => {
      const stored = readConsent();
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setShowSettings(true);
      setVisible(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (showSettings) dialogRef.current?.focus();
  }, [showSettings]);

  useEffect(() => {
    if (!showSettings) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showSettings]);

  const finish = (choice: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choice);
    setVisible(false);
    setShowSettings(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        role="region"
        aria-label={t('consent.title')}
        className="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom,0px))] z-[60] border-t border-background-200 bg-background-50 md:bottom-0"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-heading text-base font-bold text-foreground-950">
                {t('consent.title')}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground-600">
                {t('consent.intro')}{' '}
                <Link
                  to="/biskvitki"
                  className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
                >
                  {t('consent.cookiePolicyLink')}
                </Link>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 px-4 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
              >
                {t('consent.settings')}
              </button>
              <button
                type="button"
                onClick={() => finish({ analytics: false, marketing: false })}
                className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 px-4 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
              >
                {t('consent.necessaryOnly')}
              </button>
              <button
                type="button"
                onClick={() => finish({ analytics: true, marketing: true })}
                className="cursor-pointer whitespace-nowrap rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
              >
                {t('consent.acceptAll')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground-950/50 md:items-center md:p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-settings-title"
            tabIndex={-1}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-background-50 p-5 outline-none md:rounded-lg md:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="consent-settings-title"
                className="font-heading text-lg font-bold text-foreground-950"
              >
                {t('consent.settingsTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label={t('common.close')}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground-600 transition-colors hover:bg-background-100"
              >
                <i className="ri-close-line text-xl" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-start justify-between gap-4 rounded-md border border-background-200 p-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground-900">
                    {t('consent.necessaryLabel')}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-600">
                    {t('consent.necessaryDesc')}
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-primary-700">
                    {t('consent.alwaysOn')}
                  </p>
                </div>
                <ConsentSwitch
                  checked
                  disabled
                  label={t('consent.necessaryLabel')}
                  onChange={() => undefined}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-md border border-background-200 p-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground-900">
                    {t('consent.analyticsLabel')}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-600">
                    {t('consent.analyticsDesc')}
                  </p>
                </div>
                <ConsentSwitch
                  checked={analytics}
                  label={t('consent.analyticsLabel')}
                  onChange={setAnalytics}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-md border border-background-200 p-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground-900">
                    {t('consent.marketingLabel')}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-600">
                    {t('consent.marketingDesc')}
                  </p>
                </div>
                <ConsentSwitch
                  checked={marketing}
                  label={t('consent.marketingLabel')}
                  onChange={setMarketing}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 pb-safe sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => finish({ analytics: true, marketing: true })}
                className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 px-4 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
              >
                {t('consent.acceptAll')}
              </button>
              <button
                type="button"
                onClick={() => finish({ analytics, marketing })}
                className="cursor-pointer whitespace-nowrap rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
              >
                {t('consent.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}