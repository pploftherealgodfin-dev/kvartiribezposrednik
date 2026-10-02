import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { City, Neighborhood } from '@/lib/types';

interface PopularAreasProps {
  cities: City[];
  neighborhoods: Neighborhood[];
}

export default function PopularAreas({ cities, neighborhoods }: PopularAreasProps) {
  const { t } = useTranslation();

  const featuredNeighborhoods = neighborhoods.slice(0, 8);

  return (
    <section className="bg-background-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <h2 className="font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">
          {t('home.citiesTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-foreground-600">{t('home.citiesSubtitle')}</p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground-500">{t('footer.cities')}</h3>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  to={`/kvartiri-bez-posrednik/${city.slug}`}
                  className="flex items-center justify-between rounded-lg border border-background-200 bg-background-50 px-4 py-3 text-sm font-medium text-foreground-900 transition-colors hover:border-primary-300 hover:text-primary-700"
                >
                  {city.name}
                  <i className="ri-arrow-right-s-line text-base text-foreground-400" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground-500">{t('footer.neighborhoods')}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {featuredNeighborhoods.map((neighborhood) => {
                const city = cities.find((item) => item.id === neighborhood.cityId);
                if (!city) return null;
                return (
                  <Link
                    key={neighborhood.id}
                    to={`/tarsene?grad=${city.slug}&kvartal=${neighborhood.slug}`}
                    className="rounded-full border border-background-200 bg-background-100 px-4 py-2 text-sm font-medium text-foreground-800 transition-colors hover:border-primary-300 hover:text-primary-700"
                  >
                    {neighborhood.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}