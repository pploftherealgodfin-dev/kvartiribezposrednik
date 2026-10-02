import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { dashboardPath } from '@/lib/roles';

const NAV_ITEMS = [
  { to: '/tarsene', key: 'nav.search' },
  { to: '/saveti', key: 'nav.guides' },
  { to: '/kak-raboti', key: 'nav.howItWorks' },
  { to: '/kak-da-razpoznaem-posrednik', key: 'nav.recognizeBroker' },
];

export default function SiteHeader() {
  const { t } = useTranslation();
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const panelPath = session ? dashboardPath(profile?.role) : '/vhod';
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    setMenuOpen(false);
    setLogoutError(false);
    try { await signOut(); navigate('/'); } catch { setLogoutError(true); }
  };

  const displayName = profile?.name || session?.user?.email || '';

  return (
    <header className="pt-safe sticky top-0 z-40 w-full border-b border-background-200 bg-background-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:h-[68px] md:px-6">
        <Link to="/" className="flex flex-col justify-center" onClick={() => setMenuOpen(false)}>
          <span className="font-body text-[17px] font-extrabold leading-none tracking-tight text-foreground-950">
            {t('brand.markTop')}
          </span>
          <span className="mt-1 font-body text-[11px] font-medium leading-none text-primary-600">
            {t('brand.markBottom')}
          </span>
        </Link>

        <nav aria-label="Основна навигация" className="hidden items-center gap-4 xl:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary-700 ${
                  isActive ? 'text-primary-700' : 'text-foreground-700'
                }`
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            to="/kachi-obiava"
            className="hidden whitespace-nowrap rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 sm:inline-flex"
          >
            {t('nav.uploadListing')}
          </Link>

          {session && <Link to="/saobshteniya" aria-label="Съобщения" className="flex h-11 w-11 items-center justify-center rounded-md text-foreground-700 hover:bg-background-100"><i className="ri-chat-3-line text-xl" aria-hidden="true" /></Link>}
          {session ? (
            <div className="hidden items-center gap-1.5 xl:flex">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-foreground-800 transition-colors hover:text-primary-700"
                >
                  <i className="ri-shield-user-line text-base" />
                  {t('nav.admin')}
                </Link>
              )}
              <Link
                to={panelPath}
                className="flex max-w-[180px] items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-foreground-800 transition-colors hover:text-primary-700"
              >
                <i className="ri-dashboard-line text-base" />
                <span className="truncate">{displayName || t('auth.myPanel')}</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label={t('auth.logout')}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-700"
              >
                <i className="ri-logout-box-r-line text-lg" />
              </button>
            </div>
          ) : (
            <Link
              to="/vhod"
              className="hidden whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:text-primary-700 xl:inline-flex"
            >
              {t('nav.login')}
            </Link>
          )}

          <Link
            to="/lyubimi"
            aria-label={t('nav.favorites')}
            className="flex h-11 w-11 items-center justify-center rounded-md text-foreground-700 transition-colors hover:bg-background-100 hover:text-primary-700"
          >
            <i className="ri-heart-line text-xl" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-foreground-800 transition-colors hover:bg-background-100 xl:hidden"
          >
            <i className={menuOpen ? 'ri-close-line text-xl' : 'ri-menu-line text-xl'} />
          </button>
        </div>
      </div>

      {logoutError && <p role="alert" className="border-t px-4 py-3 text-center text-sm">Изходът не е потвърден. Опитай отново, преди да оставиш устройството.</p>}
      {menuOpen && (
        <div id="mobile-menu" className="max-h-[70dvh] overflow-y-auto border-t border-background-200 bg-background-50 px-4 py-3 xl:hidden">
          <nav className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground-800 transition-colors hover:bg-background-100"
              >
                {t(item.key)}
              </NavLink>
            ))}

            {session && <Link to="/saobshteniya" aria-label="Съобщения" className="flex h-11 w-11 items-center justify-center rounded-md text-foreground-700 hover:bg-background-100"><i className="ri-chat-3-line text-xl" aria-hidden="true" /></Link>}
          {session ? (
              <>
                <Link
                  to={panelPath}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-foreground-800 transition-colors hover:bg-background-100"
                >
                  <i className="ri-dashboard-line text-base" />
                  <span className="truncate">{t('auth.myPanel')}</span>
                </Link>
                <Link to="/nastroyki" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium">Контакт и настройки</Link>
                <Link to="/saobshteniya" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium">Съобщения</Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-foreground-800 transition-colors hover:bg-background-100"
                  >
                    <i className="ri-shield-user-line text-base" />
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-3 text-left text-sm font-medium text-foreground-800 transition-colors hover:bg-background-100"
                >
                  <i className="ri-logout-box-r-line text-base" />
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <Link
                to="/vhod"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground-800 transition-colors hover:bg-background-100"
              >
                {t('nav.login')}
              </Link>
            )}

            <Link
              to="/kachi-obiava"
              onClick={() => setMenuOpen(false)}
              className="mt-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-background-50"
            >
              {t('nav.uploadListing')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}