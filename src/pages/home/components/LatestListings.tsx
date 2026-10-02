import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ListingCard from '@/components/feature/ListingCard';
import type { ListingView } from '@/lib/types';

interface LatestListingsProps {
  listings: ListingView[];
  loading: boolean;
}

export default function LatestListings({ listings, loading }: LatestListingsProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-background-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground-950 md:text-3xl">
              {t('home.latestTitle')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-foreground-600">{t('home.latestSubtitle')}</p>
          </div>
          <Link
            to="/tarsene"
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-background-300 px-4 py-2 text-sm font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-600"
          >
            {t('home.viewAll')}
            <i className="ri-arrow-right-line text-base" />
          </Link>
        </div>

        {loading ? (
          <p role="status" className="mt-6 flex min-h-24 items-center justify-center rounded-lg border border-background-200 bg-background-100 text-sm text-foreground-600">Подготвяме последните обяви…</p>
        ) : listings.length === 0 ? (
          <p className="mt-6 flex min-h-24 items-center justify-center rounded-lg border border-background-200/70 bg-background-100 p-6 text-center text-sm text-foreground-600">
            {t('common.empty')}
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((view) => (
              <ListingCard key={view.listing.id} view={view} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
