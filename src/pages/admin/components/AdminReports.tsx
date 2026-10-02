import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setReportStatus, type ReportRow } from '@/lib/repository/reports';
import { formatShortDate } from '@/lib/format';

interface AdminReportsProps {
  reports: ReportRow[];
  adminId: string;
  onChanged: () => void;
}

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

export default function AdminReports({ reports, adminId, onChanged }: AdminReportsProps) {
  const { t } = useTranslation();
  const [busyId, setBusyId] = useState('');

  const resolve = async (id: string, status: 'resolved' | 'dismissed') => {
    setBusyId(id);
    try {
      await setReportStatus(id, status, adminId);
      onChanged();
    } finally {
      setBusyId('');
    }
  };

  if (reports.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center text-sm text-foreground-600">
        {t('admin.noData')}
      </p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-background-200 overflow-hidden rounded-lg border border-background-200">
      {reports.map((report) => (
        <li
          key={report.id}
          className="flex flex-col gap-3 bg-background-50 p-4 md:flex-row md:items-center md:justify-between md:p-5"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap rounded-full bg-accent-100 px-2.5 py-0.5 text-[11px] font-semibold text-accent-900">
                {t(REASON_KEY[report.reason] ?? 'report.reasonOther')}
              </span>
              <span className="whitespace-nowrap rounded-full bg-secondary-100 px-2.5 py-0.5 text-[11px] font-semibold text-secondary-900">
                {t(STATUS_KEY[report.status] ?? 'tenant.reportStatus.open')}
              </span>
              <span className="text-xs text-foreground-500">{formatShortDate(report.createdAt)}</span>
            </div>
            {report.listingSlug ? (
              <Link
                to={`/obiava/${report.listingSlug}`}
                className="mt-1.5 block truncate font-heading text-sm font-bold text-foreground-900 hover:text-primary-700"
              >
                {report.listingTitle}
              </Link>
            ) : (
              <span className="mt-1.5 block truncate font-heading text-sm font-bold text-foreground-900">
                {report.listingTitle}
              </span>
            )}
            {report.reporterId && (
              <p className="mt-1 truncate text-xs text-foreground-500">
                {t('admin.colReporter')}: {report.reporterId}
              </p>
            )}
          </div>

          {report.status === 'open' && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busyId === report.id}
                onClick={() => resolve(report.id, 'resolved')}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-600 px-3 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:opacity-60"
              >
                <i className="ri-check-line text-sm" aria-hidden="true" />
                {t('admin.resolve')}
              </button>
              <button
                type="button"
                disabled={busyId === report.id}
                onClick={() => resolve(report.id, 'dismissed')}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-2 text-xs font-semibold text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
              >
                {t('admin.dismiss')}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}