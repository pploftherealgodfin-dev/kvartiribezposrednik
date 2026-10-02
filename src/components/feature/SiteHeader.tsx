import { useState } from 'react';
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

  const panelPath = session ? dashboardPath(profile?.role) : '/vhod';
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const displayName = profile?.name || session?.user?.email || '';

  return (
    <header className="pt-safe sticky top-0 z-40 w-full border-b border-background-200 bg-background-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 md:h-[68px] md:px-6">
        <Link to="/" className="flex flex-col justify-center" onClick={() => setMenuOpen(false)}>
          <span className="font-body text-[17px] font-extrabold leading-none tracking-tight text-foreground-950">
            {t('brand.markTop')}
          </span>
          <span className="mt-1 font-body text-[11px] font-medium leading-none text-primary-600">
            {t('brand.markBottom')}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
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

          {session ? (
            <div className="hidden items-center gap-1.5 md:flex">
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
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-700"
              >
                <i className="ri-logout-box-r-line text-lg" />
              </button>
            </div>
          ) : (
            <Link
              to="/vhod"
              className="hidden whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:text-primary-700 md:inline-flex"
            >
              {t('nav.login')}
            </Link>
          )}

          <Link
            to={panelPath}
            aria-label={t('nav.favorites')}
            className="flex h-10 w-10 items-center justify-center rounded-md text-foreground-700 transition-colors hover:bg-background-100 hover:text-primary-700"
          >
            <i className="ri-heart-line text-xl" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-foreground-800 transition-colors hover:bg-background-100 md:hidden"
          >
            <i className={menuOpen ? 'ri-close-line text-xl' : 'ri-menu-line text-xl'} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-background-200 bg-background-50 px-4 py-3 md:hidden">
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