import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { repository } from '@/lib/repository';
import type { City } from '@/lib/types';
import { applyPageMeta, setJsonLd, removeJsonLd, absoluteUrl } from '@/lib/seo';
import HomeHero from '@/pages/home/components/HomeHero';
import LatestListingsSection from '@/pages/home/components/LatestListingsSection';
import HowItWorks from '@/pages/home/components/HowItWorks';
import GuidesTeaser from '@/pages/home/components/GuidesTeaser';
import FinalCta from '@/pages/home/components/FinalCta';

export default function Home() {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [catalogError, setCatalogError] = useState(false);

  const load = useCallback(async () => {
    setCatalogError(false);
    try { setCities(await repository.getCities()); } catch { setCatalogError(true); }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const brand = t('brand.name');
    applyPageMeta({
      title: 'Квартири под наем без посредник — директно от собственик',
      description:
        'Търсиш квартира под наем без посредник? Реални обяви директно от собственик в София, Пловдив, Варна и Бургас. Без комисион, без агенции, без такси за оглед.',
      canonicalPath: '/',
    });

    const origin = absoluteUrl('');
    setJsonLd('ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: brand,
      url: origin || '/',
      inLanguage: 'bg-BG',
    });
    setJsonLd('ld-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: brand,
      url: origin || '/',
      areaServed: { '@type': 'Country', name: 'България' },
    });
    return () => { removeJsonLd('ld-website'); removeJsonLd('ld-organization'); };
  }, [t]);

  return (
    <SiteLayout>
      <HomeHero cities={cities} />
      {catalogError && <div role="alert" className="mx-auto max-w-6xl px-4 py-4 text-sm">Градовете не се заредиха. <button onClick={load} className="min-h-11 text-primary-700 underline">Опитай отново</button></div>}

      <LatestListingsSection />
      <div className="below-fold"><GuidesTeaser /></div>
      <div className="below-fold"><HowItWorks /></div>
      <div className="below-fold"><FinalCta /></div>
    </SiteLayout>
  );
}
