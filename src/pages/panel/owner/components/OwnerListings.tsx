import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatEur, formatNumber, formatShortDate } from '@/lib/format';
import {
  deactivateListing,
  resubmitListing,
  markListingRented,
  type OwnerListingRow,
} from '@/lib/repository/owner';
import type { ListingStatus } from '@/lib/types';
const ListingPhotosManager = lazy(() => import('./ListingPhotosManager'));

interface OwnerListingsProps {
  listings: OwnerListingRow[];
  loading: boolean;
  onChanged: () => void;
  ownerId: string;
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-primary-100 text-primary-800',
  pending_review: 'bg-accent-100 text-accent-900',
  rented: 'bg-secondary-100 text-secondary-900',
  deactivated: 'bg-background-200 text-foreground-700',
  expired: 'bg-background-200 text-foreground-700',
  rejected: 'bg-background-200 text-foreground-700',
  flagged: 'bg-accent-100 text-accent-900',
  removed: 'bg-background-200 text-foreground-700',
};

export default function OwnerListings({
  listings,
  loading,
  onChanged,
  ownerId,
}: OwnerListingsProps) {
  const { t } = useTranslation();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');

  const handleAction = async (id: string, action: 'rented' | 'deactivate' | 'resubmit') => {
    if (busyId) return;
    setBusyId(id);
    setError('');
    try {
      if (action === 'rented') {
        await markListingRented(id);
      } else if (action === 'resubmit') {
        await resubmitListing(id);
      } else {
        await deactivateListing(id);
      }
      onChanged();
    } catch {
      setError(t('common.error'));
    } finally {
      setBusyId('');
    }
  };

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-background-200 bg-background-100" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center text-sm text-foreground-600">
        {t('owner.noListings')}
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-background-200">
      {error && (
        <p role="alert" className="border-b border-background-200 bg-background-100 px-4 py-2 text-sm text-foreground-900">
          {error}
        </p>
      )}
      <ul className="divide-y divide-background-200">
        {listings.map((item) => {
          const status = item.status as ListingStatus;
          const isExpanded = expandedId === item.id;
          return (
            <li key={item.id} className="bg-background-50 p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        STATUS_STYLE[status] ?? 'bg-background-200 text-foreground-700'
                      }`}
                    >
                      {t(`status.${status}`)}
                    </span>
                    <span className="text-xs text-foreground-500">{formatShortDate(item.createdAt)}</span>
                  </div>
                  <Link
                    to={`/obiava/${item.slug}`}
                    className="mt-1.5 block truncate font-heading text-sm font-bold text-foreground-900 hover:text-primary-700"
                  >
                    {item.title}
                  </Link>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground-700">
                    <span className="font-semibold text-foreground-900">{formatEur(item.priceEur)}</span>
                    <span className="flex items-center gap-1.5">
                      <i className="ri-eye-line text-sm text-foreground-400" aria-hidden="true" />
                      <span className="font-semibold text-foreground-900">{formatNumber(item.views)}</span>
                      {t('owner.viewsTotal')}
                      <span className="text-foreground-400">
                        ({formatNumber(item.uniqueViews)} {t('owner.viewsUnique')})
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="ri-heart-line text-sm text-foreground-400" aria-hidden="true" />
                      <span className="font-semibold text-foreground-900">{formatNumber(item.favorites)}</span>
                      {t('owner.favoritesLabel')}
                    </span>

                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    to={`/obiava/${item.slug}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-2 text-xs font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
                  >
                    <i className="ri-external-link-line text-sm" aria-hidden="true" />
                    {t('admin.colListing')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpandedId((value) => (value === item.id ? '' : item.id))}
                    aria-expanded={isExpanded}
                    className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-2 text-xs font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
                  >
                    <i className="ri-image-2-line text-sm" aria-hidden="true" />
                    {t('owner.photos')} ({item.photos})
                  </button>
                  {['draft','deactivated','expired','rejected'].includes(status) && <button disabled={Boolean(busyId)} onClick={() => handleAction(item.id, 'resubmit')} className="rounded border p-2 text-xs">Изпрати отново за преглед</button>}
                  {status === 'active' && (
                    <>
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => handleAction(item.id, 'rented')}
                        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-600 px-3 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:opacity-60"
                      >
                        <i className="ri-check-double-line text-sm" aria-hidden="true" />
                        {t('owner.markRented')}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => handleAction(item.id, 'deactivate')}
                        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-2 text-xs font-semibold text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
                      >
                        {t('owner.deactivate')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-background-200 pt-4">
                  <h3 className="font-heading text-sm font-bold text-foreground-900">
                    {t('owner.managePhotos')}
                  </h3>
                  <div className="mt-3">
                    {['draft','pending_review','rejected','deactivated','expired'].includes(status) ? <Suspense fallback={<p role="status" className="min-h-24">Зареждаме управлението на снимките…</p>}><ListingPhotosManager listingId={item.id} ownerId={ownerId} onChanged={onChanged} /></Suspense> : <p className="text-sm">За промяна на снимките първо деактивирай обявата. След редакция е необходим нов преглед.</p>}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
