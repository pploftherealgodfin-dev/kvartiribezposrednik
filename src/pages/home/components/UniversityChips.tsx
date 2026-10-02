import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { City, University } from '@/lib/types';

interface UniversityChipsProps {
  universities: University[];
  cities: City[];
}

export default function UniversityChips({ universities, cities }: UniversityChipsProps) {
  const { t } = useTranslation();

  const links = universities
    .map((university) => {
      const city = cities.find((item) => item.id === university.cityId);
      if (!city) return null;
      return {
        key: university.id,
        name: university.name,
        to: `/tarsene?grad=${city.slug}&universitet=${university.slug}`,
      };
    })
    .filter((item): item is { key: string; name: string; to: string } => item !== null);

  return (
    <section className="border-y border-background-200/70 bg-background-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
        <h2 className="font-heading text-xl font-semibold text-foreground-950 md:text-2xl">
          {t('home.universitiesTitle')}
        </h2>
        <p className="mt-1 text-sm text-foreground-600">{t('home.universitiesSubtitle')}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {links.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="rounded-full border border-background-300 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-800 transition-colors hover:border-primary-300 hover:text-primary-700"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}