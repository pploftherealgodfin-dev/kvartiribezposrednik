import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyPoint } from '@/lib/repository/owner';
import { useThemeColors } from '@/lib/themeColors';

interface OwnerTrendChartProps {
  points: DailyPoint[];
  loading: boolean;
}

type Range = 7 | 30;

export default function OwnerTrendChart({ points, loading }: OwnerTrendChartProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [range, setRange] = useState<Range>(30);

  const data = useMemo(() => (range === 7 ? points.slice(-7) : points), [points, range]);
  const total = useMemo(
    () => data.reduce((sum, point) => sum + point.views + point.favorites, 0),
    [data],
  );

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-foreground-950">
            {t('owner.chartTitle')}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-foreground-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
              {t('owner.chartViews')}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-foreground-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.accent }} />
              {t('owner.chartFavorites')}
            </span>
          </div>
        </div>

        <div className="inline-flex self-start rounded-full border border-background-300 bg-background-100 p-1">
          {([7, 30] as Range[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                range === option
                  ? 'bg-primary-500 text-background-50'
                  : 'text-foreground-700 hover:text-primary-700'
              }`}
            >
              {option === 7 ? t('owner.chartRange7') : t('owner.chartRange30')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[280px] w-full">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-md bg-background-100" />
        ) : total === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-800">
              <i className="ri-line-chart-line text-2xl" aria-hidden="true" />
            </span>
            <p className="text-sm text-foreground-600">{t('owner.chartEmpty')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFavorites" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.accent} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: colors.foreground }}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: colors.foreground }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                cursor={{ stroke: colors.grid }}
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.grid}`,
                  background: colors.surface,
                  fontSize: '12px',
                  color: colors.foreground,
                }}
                labelStyle={{ color: colors.foreground, fontWeight: 600, marginBottom: 4 }}
              />
              <Area
                type="monotone"
                name={t('owner.chartViews')}
                dataKey="views"
                stroke={colors.primary}
                strokeWidth={2}
                fill="url(#gradViews)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                name={t('owner.chartFavorites')}
                dataKey="favorites"
                stroke={colors.accent}
                strokeWidth={2}
                fill="url(#gradFavorites)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}