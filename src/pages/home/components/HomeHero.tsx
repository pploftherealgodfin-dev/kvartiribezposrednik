import { useTranslation } from 'react-i18next';
import HomeSearchForm from './HomeSearchForm';
import type { City, Neighborhood, University } from '@/lib/types';

interface HomeHeroProps {
  cities: City[];
  neighborhoods: Neighborhood[];
  universities: University[];
}

export default function HomeHero({ cities, neighborhoods, universities }: HomeHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="border-b border-background-200 bg-background-50">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 md:px-6 md:pb-16 md:pt-16">
        <p className="text-sm font-semibold text-primary-700">{t('home.eyebrow')}</p>

        <h1 className="mt-4 max-w-3xl text-balance font-heading text-[30px] font-semibold leading-[1.14] tracking-tight text-foreground-950 sm:text-4xl md:text-[52px] md:leading-[1.08]">
          {t('home.heroTitle')}
        </h1>

        <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-foreground-600 md:text-base">
          {t('home.heroSubtitle')}
        </p>

        <div className="mt-8 w-full">
          <HomeSearchForm cities={cities} neighborhoods={neighborhoods} universities={universities} />
        </div>
      </div>

      <div className="border-t border-background-200 bg-background-100">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-4 md:px-6">
          <i className="ri-checkbox-circle-fill text-base text-primary-600" />
          <p className="text-xs font-medium leading-snug text-foreground-700 md:text-sm">
            {t('home.assurance')}
          </p>
        </div>
      </div>
    </section>
  );
}