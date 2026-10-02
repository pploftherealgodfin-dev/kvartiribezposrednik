import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import ListingCard from '@/components/feature/ListingCard';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { repository } from '@/lib/repository';
import { getMyReports, type ReportRow } from '@/lib/repository/reports';
import { formatShortDate } from '@/lib/format';
import type { ListingView } from '@/lib/types';

const REASON_KEY: Record<string, string> = {
  broker: 'report.reasonBroker',
  fake: 'report.reasonFake',
  rented: 'report.reasonRented',
  wrong_info: 'report.reasonWrongInfo',
  wrong_price: 'report.reasonWrongInfo',
  already_rented: 'report.reasonRented',
  other: 'report.reasonOther',
};

const STATUS_KEY: Record<string, string> = {
  open: 'tenant.reportStatus.open',
  resolved: 'tenant.reportStatus.resolved',
  dismissed: 'tenant.reportStatus.dismissed',
};

export default function TenantPanelPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { favoriteIds } = useFavorites();

  const [favorites, setFavorites] = useState<ListingView[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setFavorites([]);
      return;
    }
    let active = true;
    repository
      .getListingViewsByIds(favoriteIds)
      .then((views) => {
        if (active) setFavorites(views);
      })
      .catch(() => {
        if (active) setFavorites([]);
      });
    return () => {
      active = false;
    };
  }, [favoriteIds]);

  useEffect(() => {
    const userId = profile?.id;
    if (!userId) return;
    let active = true;
    setLoading(true);
    setError(false);
    getMyReports(userId)
      .then((rows) => {
        if (active) setReports(rows);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile?.id]);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground-950 md:text-3xl">
          {t('tenant.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground-600">{t('tenant.subtitle')}</p>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-extrabold text-foreground-950">
              {t('tenant.favoritesTitle')}
            </h2>
            <Link
              to="/tarsene"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3.5 py-2 text-xs font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
            >
              <i className="ri-search-line text-sm" aria-hidden="true" />
              {t('tenant.browse')}
            </Link>
          </div>

          {favorites.length === 0 ? (
            <p className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center text-sm text-foreground-600">
              {t('tenant.favoritesEmpty')}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((view) => (
                <ListingCard key={view.listing.id} view={view} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-lg font-extrabold text-foreground-950">
            {t('tenant.reportsTitle')}
          </h2>

          {error ? (
            <div className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center">
              <p className="text-sm text-foreground-700">{t('common.error')}</p>
            </div>
          ) : loading ? (
            <div className="mt-4 h-24 animate-pulse rounded-lg border border-background-200 bg-background-100" />
          ) : reports.length === 0 ? (
            <p className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center text-sm text-foreground-600">
              {t('tenant.reportsEmpty')}
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-background-200">
              <ul className="divide-y divide-background-200">
                {reports.map((report) => (
                  <li
                    key={report.id}
                    className="flex flex-col gap-2 bg-background-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      {report.listingSlug ? (
                        <Link
                          to={`/obiava/${report.listingSlug}`}
                          className="block truncate text-sm font-semibold text-foreground-900 hover:text-primary-700"
                        >
                          {report.listingTitle}
                        </Link>
                      ) : (
                        <span className="block truncate text-sm font-semibold text-foreground-900">
                          {report.listingTitle}
                        </span>
                      )}
                      <p className="mt-1 text-xs text-foreground-600">
                        {t('tenant.reportReason')}: {t(REASON_KEY[report.reason] ?? 'report.reasonOther')}
                        {' · '}
                        {formatShortDate(report.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap self-start rounded-full bg-secondary-100 px-3 py-1 text-[11px] font-semibold text-secondary-900 sm:self-auto">
                      {t(STATUS_KEY[report.status] ?? 'tenant.reportStatus.open')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}