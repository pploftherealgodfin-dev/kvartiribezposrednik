import { Link } from 'react-router-dom';
import type { CityContent } from '@/pages/cities/data';

interface CityDirectoryProps {
  cities: CityContent[];
  title: string;
  subtitle?: string;
}

export default function CityDirectory({ cities, title, subtitle }: CityDirectoryProps) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground-950 md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-foreground-600">{subtitle}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.slug}
            to={`/kvartiri-bez-posrednik/${city.slug}`}
            className="group flex items-center gap-4 overflow-hidden rounded-lg border border-background-200 bg-background-50 p-3 transition-colors hover:border-primary-300"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-background-200">
              <img
                src={city.heroImage}
                alt={`Квартири под наем без посредник ${city.inPhrase}`}
                title={`Квартири под наем без посредник ${city.inPhrase}`}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-bold text-foreground-950 transition-colors group-hover:text-primary-700">
                Квартири в {city.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-foreground-500">{city.region}</p>
            </div>
            <i
              className="ml-auto ri-arrow-right-line text-lg text-foreground-400 transition-colors group-hover:text-primary-600"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}