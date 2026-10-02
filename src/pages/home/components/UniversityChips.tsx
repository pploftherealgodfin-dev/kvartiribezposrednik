import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import LocationSelect from '@/components/feature/LocationSelect';
import { Link, useNavigate } from 'react-router-dom';
import type { City, University } from '@/lib/types';

interface UniversityChipsProps {
  universities: University[];
  cities: City[];
}

export default function UniversityChips({ universities, cities }: UniversityChipsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

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

        <div className="mt-6 max-w-2xl"><LocationSelect id="home-university" label="Намери университет или филиал" value={selected} placeholder="Избери учебно заведение" options={links.map(link => ({ value: link.key, label: link.name }))} onChange={value => { setSelected(value); const target = links.find(link => link.key === value); if (target) navigate(target.to); }} /></div>
        <div className="mt-5 flex flex-wrap gap-2">
          {links.slice(0, 6).map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="rounded-full border border-background-300 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-800 transition-colors hover:border-primary-300 hover:text-primary-700"
            >
              {item.name}
            </Link>
          ))}
        </div><Link to="/kvartiri-bez-posrednik" className="mt-5 inline-block text-primary-700 underline">Всички университетски градове и останалите градове в България</Link>
      </div>
    </section>
  );
}