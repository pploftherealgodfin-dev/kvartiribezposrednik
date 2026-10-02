import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { repository } from '@/lib/repository';
import type { City, ListingView, Neighborhood, University } from '@/lib/types';
import { applyPageMeta, setJsonLd, removeJsonLd, absoluteUrl } from '@/lib/seo';
import HomeHero from '@/pages/home/components/HomeHero';
import TrustStrip from '@/pages/home/components/TrustStrip';
import Audiences from '@/pages/home/components/Audiences';
import LatestListings from '@/pages/home/components/LatestListings';
import UniversityChips from '@/pages/home/components/UniversityChips';
import PopularAreas from '@/pages/home/components/PopularAreas';
import HowItWorks from '@/pages/home/components/HowItWorks';
import BrokerTeaser from '@/pages/home/components/BrokerTeaser';
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [cityItems, neighborhoodItems, universityItems, listingItems] = await Promise.all([
        repository.getCities(),
        repository.getNeighborhoods(),
        repository.getUniversities(),
        repository.getLatestListings(8),
      ]);
      setCities(cityItems);
      setNeighborhoods(neighborhoodItems);
      setUniversities(universityItems);
      setListings(listingItems);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
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
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/tarsene?t={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
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
      <TrustStrip />

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
          <Audiences />
          <BrokerTeaser />
          <GuidesTeaser />
          <UniversityChips universities={universities} cities={cities} />
          <PopularAreas cities={cities} neighborhoods={neighborhoods} />
          <HowItWorks />
          <FinalCta />
    </SiteLayout>
  );
}