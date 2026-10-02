import { Link } from 'react-router-dom';

export interface CityChipItem {
  label: string;
  to?: string;
}

interface CityChipsProps {
  items: CityChipItem[];
  icon?: string;
}

export default function CityChips({ items, icon }: CityChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) =>
        item.to ? (
          <Link
            key={item.label}
            to={item.to}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-background-300 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-800 transition-colors hover:border-primary-300 hover:text-primary-700"
          >
            {icon && <i className={`${icon} text-base text-foreground-500`} aria-hidden="true" />}
            {item.label}
          </Link>
        ) : (
          <span
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-background-200 bg-background-100 px-4 py-2 text-sm font-medium text-foreground-700"
          >
            {icon && <i className={`${icon} text-base text-foreground-500`} aria-hidden="true" />}
            {item.label}
          </span>
        ),
      )}
    </div>
  );
}