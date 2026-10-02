import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ListingCard from '@/components/feature/ListingCard';
import type { ListingView } from '@/lib/types';

interface CityListingsProps {
  cityName: string;
  citySlug: string;
  listings: ListingView[];
  total: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export default function CityListings({
  cityName,
  citySlug,
  listings,
  total,
  loading,
  error,
  onRetry,
}: CityListingsProps) {
  const { t } = useTranslation();

  return (
    <section>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground-950 md:text-3xl">
            {t('cities.listingsTitle', { city: cityName })}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground-600">
            {t('cities.listingsSubtitle')}
          </p>
        </div>
        {total > 0 && (
          <Link
            to={`/tarsene?grad=${citySlug}`}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
          >
            {t('cities.viewAll')}
            <i className="ri-arrow-right-line text-base" aria-hidden="true" />
          </Link>
        )}
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-background-200 bg-background-100 p-6 text-center">
          <p className="text-sm text-foreground-700">{t('common.error')}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
          >
            <i className="ri-refresh-line text-base" aria-hidden="true" />
            {t('common.retry')}
          </button>
        </div>
      ) : loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Зареждаме публикуваните обяви">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-lg border border-background-200 bg-background-100"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-background-300 bg-background-100 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-200 text-foreground-500">
            <i className="ri-building-2-line text-2xl" aria-hidden="true" />
          </span>
          <p className="mt-4 font-heading text-base font-bold text-foreground-900">
            {t('cities.noListings', { city: cityName })}
          </p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-foreground-600">Все още няма публикувани предложения тук. Местната информация по-долу може да ти помогне да се ориентираш; разгледай и близките градове или публикувай свое жилище.</p>
          <Link
            to="/kachi-obiava"
            className="mt-5 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
          >
            <i className="ri-add-line text-base" aria-hidden="true" />
            Публикувай жилище
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((view) => (
            <ListingCard key={view.listing.id} view={view} />
          ))}
        </div>
      )}

      {!loading && !error && listings.length > 0 && listings.length < total && (
        <p className="mt-4 text-center text-xs text-foreground-500">
          {t('cities.showingOf', { shown: listings.length, total })}
        </p>
      )}

    </section>
  );
}
