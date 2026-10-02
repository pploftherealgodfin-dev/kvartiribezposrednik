import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { useThemeColors } from '@/lib/themeColors';

interface ListingSparklineProps {
  /** Дневни стойности (напр. гледания по дни). */
  values: number[];
  /** 'primary' (по подразбиране) или 'accent'. */
  tone?: 'primary' | 'accent';
  label?: string;
}

/**
 * Малка графика-искра без оси — показва тенденцията по дни.
 * Разчита цветовете от дизайн системата, за да е в крак с палитрата.
 */
export default function ListingSparkline({ values, tone = 'primary', label }: ListingSparklineProps) {
  const colors = useThemeColors();
  const color = tone === 'accent' ? colors.accent : colors.primary;

  const data = useMemo(() => values.map((value, index) => ({ index, value })), [values]);
  const hasSignal = values.some((value) => value > 0);

  return (
    <span
      className="flex h-9 w-24 shrink-0 items-center"
      role="img"
      aria-label={label ?? ''}
      title={label}
    >
      {hasSignal ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 3, bottom: 4, left: 3 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded bg-background-100">
          <i className="ri-subtract-line text-sm text-foreground-400" aria-hidden="true" />
        </span>
      )}
    </span>
  );
}