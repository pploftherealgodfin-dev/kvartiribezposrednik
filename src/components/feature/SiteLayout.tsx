import { useFavorites } from '@/hooks/useFavorites';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import SiteHeader from './SiteHeader';
import AccountNav from './AccountNav';
import SiteFooter from './SiteFooter';
import MobileBottomNav from './MobileBottomNav';
import CookieConsent from './CookieConsent';

interface SiteLayoutProps {
  children: ReactNode;
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  const { t } = useTranslation();
  const { error: favoriteError } = useFavorites();

  return (
    <div className="flex min-h-screen flex-col bg-background-50 pb-[calc(62px+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background-50"
      >
        {t('a11y.skip')}
      </a>
      <SiteHeader />
      <AccountNav />
      {favoriteError && <div role="alert" className="border-b border-accent-200 bg-accent-50 px-4 py-3 text-center text-sm text-foreground-900">{favoriteError}</div>}
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <MobileBottomNav />
      <CookieConsent />
    </div>
  );
}