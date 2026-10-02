import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HomeSearchForm from './HomeSearchForm';
import type { City, Neighborhood, University } from '@/lib/types';
export default function HomeHero({ cities, neighborhoods, universities }: { cities: City[]; neighborhoods: Neighborhood[]; universities: University[] }) {
  const { t } = useTranslation();
  return <section className="border-b border-background-200 bg-background-100"><div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
    <div><p className="text-sm font-semibold text-primary-700">{t('home.eyebrow')}</p><h1 className="mt-4 text-balance font-heading text-[32px] font-semibold leading-[1.14] tracking-tight text-foreground-950 sm:text-4xl md:text-[48px] md:leading-[1.08]">{t('home.heroTitle')}</h1><p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-foreground-600 md:text-base">{t('home.heroSubtitle')}</p><div className="mt-6 flex items-start gap-2.5"><i className="ri-checkbox-circle-line mt-0.5 text-primary-600" aria-hidden="true" /><p className="text-sm leading-relaxed text-foreground-700">{t('home.assurance')}</p></div><Link to="/kvartiri-bez-posrednik" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-700">Опознай града, преди да избереш дом<i className="ri-arrow-right-line" aria-hidden="true" /></Link></div>
    <HomeSearchForm cities={cities} neighborhoods={neighborhoods} universities={universities} />
  </div></section>;
}
