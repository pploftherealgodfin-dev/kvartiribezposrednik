import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { repository } from '@/lib/repository';
import {
  applyPageMeta,
  breadcrumbJsonLd,
  faqJsonLd,
  removeJsonLd,
  setJsonLd,
} from '@/lib/seo';
import type { City, ListingView, Neighborhood, University } from '@/lib/types';
import { getCityContent, getOtherCities } from '@/pages/cities/data';
import type { CityChipItem } from '@/pages/cities/components/CityChips';
import CityHero from '@/pages/cities/components/CityHero';
import CityListings from '@/pages/cities/components/CityListings';
import CityFacts from '@/pages/cities/components/CityFacts';
import CityChips from '@/pages/cities/components/CityChips';
import CityFaq from '@/pages/cities/components/CityFaq';
import CityDirectory from '@/pages/cities/components/CityDirectory';
import CityGuides from '@/pages/cities/components/CityGuides';

export default function CityLandingPage() {
  const { t } = useTranslation();
  const { grad } = useParams();
  const content = getCityContent(grad);

  const [listings, setListings] = useState<ListingView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);

  useEffect(() => {
    if (!content) {
      applyPageMeta({
        title: `Градът не е намерен | ${t('brand.name')}`,
        robots: 'noindex, follow',
      });
      return undefined;
    }

    const path = `/kvartiri-bez-posrednik/${content.slug}`;
    applyPageMeta({
      title: `Квартири под наем без посредник ${content.inPhrase}`,
      description: `Квартири под наем без посредник ${content.inPhrase}: обяви директно от собственик, без комисион и агенции. Разгледай свободните жилища и се свържи директно.`,
      canonicalPath: path,
      ogImage: content.heroImage,
    });

    setJsonLd(
      'ld-breadcrumb-city',
      breadcrumbJsonLd([
        { name: 'Начало', path: '/' },
        { name: 'Квартири по градове', path: '/kvartiri-bez-posrednik' },
        { name: `Квартири под наем без посредник ${content.inPhrase}`, path },
      ]),
    );
    setJsonLd('ld-faq-city', faqJsonLd(content.faq));

    return () => {
      removeJsonLd('ld-breadcrumb-city');
      removeJsonLd('ld-faq-city');
    };
  }, [content, t]);

  useEffect(() => {
    if (!content) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError(false);
    repository
      .search({
        filters: { citySlug: content.slug, type: 'all' },
        sort: 'newest',
        page: 1,
        pageSize: 6,
      })
      .then((result) => {
        if (!active) return;
        setListings(result.items);
        setTotal(result.total);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [content, reloadKey]);

  useEffect(() => {
    let active = true;
    Promise.all([
      repository.getCities(),
      repository.getNeighborhoods(),
      repository.getUniversities(),
    ])
      .then(([cityItems, hoodItems, uniItems]) => {
        if (!active) return;
        setCities(cityItems);
        setNeighborhoods(hoodItems);
        setUniversities(uniItems);
      })
      .catch(() => {
        /* референтните данни не са критични */
      });
    return () => {
      active = false;
    };
  }, []);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  if (!content) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center md:px-6">
          <h1 className="font-heading text-2xl font-bold text-foreground-950">
            {t('cities.notFound')}
          </h1>
          <Link
            to="/kvartiri-bez-posrednik"
            className="mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
          >
            <i className="ri-arrow-left-line text-base" aria-hidden="true" />
            {t('cities.backToHub')}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const cityRow = cities.find((item) => item.slug === content.slug);
  const uniChips: CityChipItem[] =
    cityRow && universities.some((item) => item.cityId === cityRow.id)
      ? universities
          .filter((item) => item.cityId === cityRow.id)
          .map((item) => ({
            label: item.name,
            to: `/tarsene?grad=${content.slug}&universitet=${item.slug}`,
          }))
      : content.universities.map((label) => ({ label }));

  const areaChips: CityChipItem[] =
    cityRow && neighborhoods.some((item) => item.cityId === cityRow.id)
      ? neighborhoods
          .filter((item) => item.cityId === cityRow.id)
          .map((item) => ({
            label: item.name,
            to: `/tarsene?grad=${content.slug}&kvartal=${item.slug}`,
          }))
      : content.areas.map((label) => ({ label }));

  const otherCities = getOtherCities(content.slug);

  return (
    <SiteLayout>
      <CityHero city={content} listingCount={total} />

      <section className="bg-background-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-14">
          <CityListings
            cityName={content.name}
            citySlug={content.slug}
            cityInPhrase={content.inPhrase}
            listings={listings}
            total={total}
            loading={loading}
            error={error}
            onRetry={retry}
          />
        </div>
      </section>

      <section className="border-y border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <CityFacts city={content} />
        </div>
      </section>

      <section className="bg-background-50">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-14 md:px-6 md:py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
              {t('cities.universitiesTitle', { city: content.name })}
            </h2>
            <p className="mt-2 text-sm text-foreground-600">{t('cities.universitiesSubtitle')}</p>
            <div className="mt-5">
              <CityChips items={uniChips} icon="ri-graduation-cap-line" />
            </div>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
              {t('cities.areasTitle', { city: content.name })}
            </h2>
            <p className="mt-2 text-sm text-foreground-600">{t('cities.areasSubtitle')}</p>
            <div className="mt-5">
              <CityChips items={areaChips} icon="ri-map-pin-2-line" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-3xl px-4 py-14 md:px-6 md:py-16">
          <CityFaq items={content.faq} title={t('cities.faqTitle')} />
        </div>
      </section>

      <section className="bg-background-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <CityDirectory
            cities={otherCities}
            title={t('cities.otherCities')}
            subtitle={t('cities.otherCitiesSubtitle')}
          />
        </div>
      </section>

      <section className="border-t border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <CityGuides />
        </div>
      </section>

      <section className="bg-background-50">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-2 md:px-6">
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-6 md:flex md:items-center md:justify-between md:gap-6 md:p-8">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
                {t('cities.ctaTitle')}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground-700">
                {t('cities.ctaText')}
              </p>
            </div>
            <Link
              to={`/tarsene?grad=${content.slug}`}
              className="mt-5 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 md:mt-0"
            >
              <i className="ri-search-line text-base" aria-hidden="true" />
              {t('cities.viewListings')}
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}