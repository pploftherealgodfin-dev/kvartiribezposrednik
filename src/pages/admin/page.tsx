import StaffMfaGate from '@/components/feature/StaffMfaGate';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  getAdminListings,
  getAdminUsers,
  type AdminListingRow,
  type AdminUserRow,
} from '@/lib/repository/admin';
import { getAllReports, type ReportRow } from '@/lib/repository/reports';
import AdminUsers from './components/AdminUsers';
import AdminListings from './components/AdminListings';
import AdminReports from './components/AdminReports';

type Tab = 'users' | 'listings' | 'reports';

const TABS: { key: Tab; labelKey: string; icon: string }[] = [
  { key: 'users', labelKey: 'admin.tabUsers', icon: 'ri-group-line' },
  { key: 'listings', labelKey: 'admin.tabListings', icon: 'ri-home-4-line' },
  { key: 'reports', labelKey: 'admin.tabReports', icon: 'ri-flag-line' },
];

function AdminPanelContent() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const adminId = profile?.id ?? '';

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [listings, setListings] = useState<AdminListingRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [userRows, listingRows, reportRows] = await Promise.all([
        getAdminUsers(),
        getAdminListings(),
        getAllReports(),
      ]);
      setUsers(userRows);
      setListings(listingRows);
      setReports(reportRows);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground-950 md:text-3xl">
          {t('admin.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground-600">{t('admin.subtitle')}</p>

        <div className="mt-6 inline-flex flex-wrap items-center gap-1 rounded-full border border-background-200 bg-background-100 px-1 py-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                tab === item.key
                  ? 'bg-primary-600 text-background-50'
                  : 'text-foreground-700 hover:bg-background-50'
              }`}
            >
              <i className={`${item.icon} text-base`} aria-hidden="true" />
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg border border-background-200 bg-background-100" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center">
            <p className="text-sm text-foreground-700">{t('admin.loadError')}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
            >
              <i className="ri-refresh-line text-base" aria-hidden="true" />
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <>
            {tab === 'users' && <AdminUsers users={users} onChanged={load} canManage={profile?.role === 'admin'} currentUserId={adminId} />}
            {tab === 'listings' && <AdminListings listings={listings} onChanged={load} />}
            {tab === 'reports' && (
              <AdminReports reports={reports} adminId={adminId} onChanged={load} />
            )}
          </>
        )}
      </div>
    </SiteLayout>
  );
}
export default function AdminPanelPage() { return <StaffMfaGate><AdminPanelContent /></StaffMfaGate>; }
import '@/i18n/legal';
