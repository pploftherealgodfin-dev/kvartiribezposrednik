import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { dashboardPath } from '@/lib/roles';

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { session, profile } = useAuth();

  const panelPath = session ? dashboardPath(profile?.role) : '/vhod';

  const tabs = [
    { to: '/tarsene', key: 'nav.search', icon: 'ri-search-line' },
    { to: panelPath, key: 'auth.myPanel', icon: 'ri-dashboard-line' },
    { to: '/kachi-obiava', key: 'nav.uploadListing', icon: 'ri-add-line' },
    session
      ? { to: '/moi-profil', key: 'auth.account', icon: 'ri-user-line' }
      : { to: '/vhod', key: 'nav.login', icon: 'ri-user-line' },
  ];

  return (
    <nav
      aria-label={t('nav.menu')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-background-200 bg-background-50/95 backdrop-blur md:hidden"
    >
      <div className="pb-safe">
        <div className="flex h-[62px] items-stretch px-1">
          {tabs.map((tab) => (
            <NavLink
              key={`${tab.to}-${tab.key}`}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary-700' : 'text-foreground-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <i className={`${tab.icon} text-xl ${isActive ? 'text-primary-700' : ''}`} />
                  <span className="whitespace-nowrap">{t(tab.key)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}