import { useTranslation } from 'react-i18next';
import type { OwnerStats } from '@/lib/repository/owner';

interface OwnerStatsCardsProps {
  stats: OwnerStats | null;
  loading: boolean;
}

export default function OwnerStatsCards({ stats, loading }: OwnerStatsCardsProps) {
  const { t } = useTranslation();

  const items = [
    { key: 'owner.statListings', value: stats?.totalListings ?? 0, icon: 'ri-home-4-line' },
    { key: 'owner.statActive', value: stats?.activeListings ?? 0, icon: 'ri-checkbox-circle-line' },
    { key: 'owner.statViews', value: stats?.totalViews ?? 0, icon: 'ri-eye-line' },
    { key: 'owner.statFavorites', value: stats?.totalFavorites ?? 0, icon: 'ri-heart-line' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background-100 text-foreground-700">
            <i className={`${item.icon} text-xl`} aria-hidden="true" />
          </span>
          <p className="mt-3 font-heading text-2xl font-extrabold text-foreground-950">
            {loading ? '—' : item.value}
          </p>
          <p className="text-xs text-foreground-600">{t(item.key)}</p>
        </div>
      ))}
    </div>
  );
}