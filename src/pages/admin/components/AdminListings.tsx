import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  deleteListing,
  setListingStatus,
  type AdminListingRow,
} from '@/lib/repository/admin';
import { formatEur, formatShortDate } from '@/lib/format';
import type { ListingStatus } from '@/lib/types';

interface AdminListingsProps {
  listings: AdminListingRow[];
  onChanged: () => void;
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
  draft: 'bg-background-200 text-foreground-700',
};

export default function AdminListings({ listings, onChanged }: AdminListingsProps) {
  const { t } = useTranslation();
  const [busyId, setBusyId] = useState('');

  const change = async (id: string, status: ListingStatus) => {
    setBusyId(id);
    try {
      await setListingStatus(id, status);
      onChanged();
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await deleteListing(id);
      onChanged();
    } finally {
      setBusyId('');
    }
  };

  if (listings.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center text-sm text-foreground-600">
        {t('admin.noData')}
      </p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-background-200 overflow-hidden rounded-lg border border-background-200">
      {listings.map((item) => {
        const status = item.status as ListingStatus;
        return (
          <li
            key={item.id}
            className="flex flex-col gap-3 bg-background-50 p-4 md:flex-row md:items-center md:justify-between md:p-5"
          >
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
              <p className="mt-1 text-xs text-foreground-600">
                {t('admin.colOwner')}: {item.ownerName} · {formatEur(item.priceEur)}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {(status === 'pending_review' || status === 'rejected') && (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => change(item.id, 'active')}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-600 px-3 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  <i className="ri-check-line text-sm" aria-hidden="true" />
                  {t('admin.approve')}
                </button>
              )}
              {status === 'pending_review' && (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => change(item.id, 'rejected')}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-2 text-xs font-semibold text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
                >
                  {t('admin.reject')}
                </button>
              )}
              {status !== 'removed' && (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => remove(item.id)}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-2 text-xs font-semibold text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
                >
                  {t('admin.remove')}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}