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
          <div className="ui-panel mt-6 bg-background-100"><h3 className="font-heading text-lg font-semibold">Още няма публични обяви</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-600">Имаш свободно жилище? Представи го с ясни условия и реални снимки. Формата ще те насочи стъпка по стъпка.</p><div className="mt-5 flex flex-wrap gap-3"><Link className="ui-button" to="/kachi-obiava">Качи първата си обява</Link><Link className="ui-secondary" to="/kvartiri-bez-posrednik">Разгледай градовете</Link></div></div>
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
