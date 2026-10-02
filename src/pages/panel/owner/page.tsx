import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { repository } from '@/lib/repository';
import { getOwnerDailyStats, getOwnerListingTrends, getOwnerStats, type DailyPoint, type ListingTrend, type OwnerStats } from '@/lib/repository/owner';
import type { City, Neighborhood, University } from '@/lib/types';
import OwnerStatsCards from './components/OwnerStatsCards';
import OwnerListings from './components/OwnerListings';
import OwnerTrendChart from './components/OwnerTrendChart';
import ListingForm from './components/ListingForm';

export default function OwnerPanelPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const ownerId = profile?.id ?? '';

  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [trends, setTrends] = useState<Record<string, ListingTrend>>({});
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(params.get('nova') === '1');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(false);
    try {
      const [statData, cityItems, hoodItems, dailyPoints, trendData, uniItems] = await Promise.all([
        getOwnerStats(ownerId),
        repository.getCities(),
        repository.getNeighborhoods(),
        getOwnerDailyStats(ownerId),
        getOwnerListingTrends(ownerId),
        repository.getUniversities(),
      ]);
      setUniversities(uniItems);
      setStats(statData);
      setCities(cityItems);
      setNeighborhoods(hoodItems);
      setDaily(dailyPoints);
      setTrends(trendData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground-950 md:text-3xl">
              {t('owner.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground-600">{t('owner.subtitle')}</p><Link to="/nastroyki" className="mt-3 inline-block text-sm text-primary-700 underline">Настрой контактите по обявите</Link>
          </div>
          <button
            type="button"
            disabled={loading || error}
            onClick={() => {
              setShowForm((value) => !value);
              setNotice('');
            }}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
          >
            <i className={showForm ? 'ri-close-line text-base' : 'ri-add-line text-base'} aria-hidden="true" />
            {t('owner.newListing')}
          </button>
        </div>

        {notice && (
          <p className="mt-5 flex items-center gap-2 rounded-md bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800">
            <i className="ri-checkbox-circle-line text-base" aria-hidden="true" />
            {notice}
          </p>
        )}

        {showForm && ownerId && (
          <ListingForm
            ownerId={ownerId}
            cities={cities}
            neighborhoods={neighborhoods}
            universities={universities}
            onCancel={() => setShowForm(false)}
            onCreated={() => {
              setShowForm(false);
              setNotice(t('owner.form.success'));
              load();
            }}
          />
        )}

        <div className="mt-8">
          <OwnerStatsCards stats={stats} loading={loading} />
        </div>

        <div className="mt-6">
          <OwnerTrendChart points={daily} loading={loading} />
        </div>

        <div className="mt-10">
          <h2 className="font-heading text-lg font-extrabold text-foreground-950">
            {t('owner.myListings')}
          </h2>

          {error ? (
            <div className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center">
              <p className="text-sm text-foreground-700">{t('common.error')}</p>
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
            <OwnerListings
              listings={stats?.listings ?? []}
              trends={trends}
              loading={loading}
              onChanged={load}
              ownerId={ownerId}
            />
          )}
        </div>
      </div>
    </SiteLayout>
  );
}