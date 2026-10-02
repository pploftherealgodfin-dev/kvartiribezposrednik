import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { repository } from '@/lib/repository';
import type { City, ListingView, Neighborhood, University } from '@/lib/types';
import { applyPageMeta, setJsonLd, removeJsonLd, absoluteUrl } from '@/lib/seo';
import HomeHero from '@/pages/home/components/HomeHero';
import LatestListings from '@/pages/home/components/LatestListings';
import HowItWorks from '@/pages/home/components/HowItWorks';
import GuidesTeaser from '@/pages/home/components/GuidesTeaser';
import FinalCta from '@/pages/home/components/FinalCta';

export default function Home() {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [listings, setListings] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [catalogError, setCatalogError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false); setCatalogError(false);
    await Promise.allSettled([
      Promise.all([repository.getCities(), repository.getNeighborhoods(), repository.getUniversities()])
        .then(([cityItems, neighborhoodItems, universityItems]) => {
          setCities(cityItems); setNeighborhoods(neighborhoodItems); setUniversities(universityItems);
        }).catch(() => setCatalogError(true)),
      repository.getLatestListings(6).then(setListings).catch(() => setError(true)).finally(() => setLoading(false)),
    ]);
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
      <HomeHero cities={cities} neighborhoods={neighborhoods} universities={universities} />
      {catalogError && <div role="alert" className="mx-auto max-w-6xl px-4 py-4 text-sm">Градовете не се заредиха. <button onClick={load} className="min-h-11 text-primary-700 underline">Опитай отново</button></div>}

      {error ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
          <div className="rounded-lg border border-background-200/70 bg-background-100 p-6 text-center">
            <p className="text-sm text-foreground-700">{t('common.error')}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
            >
              <i className="ri-refresh-line text-base" />
              {t('common.retry')}
            </button>
          </div>
        </section>
      ) : (
        <>
          <LatestListings listings={listings} loading={loading} />
        </>
      )}
      <div className="below-fold"><GuidesTeaser /></div>
      <div className="below-fold"><HowItWorks /></div>
      <div className="below-fold"><FinalCta /></div>
    </SiteLayout>
  );
}
