import { useTranslation } from 'react-i18next';
import ListingCard from '@/components/feature/ListingCard';
import { formatNumber } from '@/lib/format';
import type { SortKey } from '@/lib/ranking';
import type { ListingView } from '@/lib/types';

interface SearchResultsProps {
  listings: ListingView[];
  total: number;
  page: number;
  totalPages: number;
  sort: SortKey;
  loading: boolean;
  error: boolean;
  onSortChange: (sort: SortKey) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onReset: () => void;
}

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: 'relevance', labelKey: 'search.sortRelevance' },
  { key: 'newest', labelKey: 'search.sortNewest' },
  { key: 'cheapest', labelKey: 'search.sortCheapest' },
  { key: 'pricePerM2', labelKey: 'search.sortPricePerM2' },
];

function pageWindow(page: number, totalPages: number): number[] {
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

export default function SearchResults({
  listings,
  total,
  page,
  totalPages,
  sort,
  loading,
  error,
  onSortChange,
  onPageChange,
  onRetry,
  onReset,
}: SearchResultsProps) {
  const { t } = useTranslation();

  return (
    <div aria-busy={loading}>
      <div className="flex flex-col gap-3 rounded-lg border border-background-200 bg-background-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-sm text-foreground-700">
          <span className="font-heading text-base font-extrabold text-foreground-950">
            {loading ? 'Зареждане…' : error ? 'Недостъпни' : formatNumber(total)}
          </span>{' '}
          {t('search.results')}
        </p>
        <label className="flex items-center gap-2 text-sm text-foreground-600">
          <i className="ri-sort-desc text-base text-foreground-400" aria-hidden="true" />
          <span className="whitespace-nowrap">{t('search.sort')}</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            className="cursor-pointer rounded-md border border-background-300 bg-background-50 px-3 py-2 text-sm font-medium text-foreground-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-background-200 bg-background-100 p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-800">
            <i className="ri-error-warning-line text-2xl" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm text-foreground-700">{t('common.error')}</p>
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
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-lg border border-background-200 bg-background-100"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-6 rounded-lg border border-background-200 bg-background-100 p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-100 text-secondary-800">
            <i className="ri-search-eye-line text-2xl" aria-hidden="true" />
          </span>
          <p className="mt-4 font-heading text-base font-bold text-foreground-900">{t('search.empty')}</p>
          <p className="mt-1.5 text-sm text-foreground-600">{t('search.emptyHint')}</p><button type="button" onClick={onReset} className="mt-5 rounded-md border border-primary-600 px-5 py-3 font-semibold text-primary-700">Изчисти филтрите</button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((view) => (
              <ListingCard key={view.listing.id} view={view} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-8 flex items-center justify-center gap-2"
              aria-label={t('search.page')}
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                aria-label={t('search.prev')}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-700 transition-colors hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="ri-arrow-left-s-line text-lg" aria-hidden="true" />
              </button>

              {pageWindow(page, totalPages).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => onPageChange(item)}
                  className={`h-10 min-w-[40px] cursor-pointer rounded-md border px-3 text-sm font-semibold transition-colors ${
                    item === page
                      ? 'border-primary-500 bg-primary-500 text-background-50'
                      : 'border-background-300 bg-background-50 text-foreground-800 hover:border-primary-300'
                  }`}
                >
                  {item}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                aria-label={t('search.next')}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-700 transition-colors hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="ri-arrow-right-s-line text-lg" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}