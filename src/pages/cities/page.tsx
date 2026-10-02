import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import {
  applyPageMeta,
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  removeJsonLd,
  setJsonLd,
} from '@/lib/seo';
import { cityContents } from '@/pages/cities/data';
import CityDirectory from '@/pages/cities/components/CityDirectory';
import CityGuides from '@/pages/cities/components/CityGuides';


export default function CitiesHubPage() {
  const { t } = useTranslation();

  useEffect(() => {
    applyPageMeta({
      title: 'Квартири под наем без посредник — по градове в цяла България',
      description:
        'Квартири под наем без посредник в София, Пловдив, Варна, Бургас и още университетски градове. Реални обяви директно от собственик — без комисион и без агенции.',
      canonicalPath: '/kvartiri-bez-posrednik',
    });

    setJsonLd(
      'ld-breadcrumb-hub',
      breadcrumbJsonLd([
        { name: 'Начало', path: '/' },
        { name: 'Квартири по градове', path: '/kvartiri-bez-posrednik' },
      ]),
    );
    setJsonLd('ld-hub-cities', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Квартири под наем без посредник по градове',
      itemListElement: cityContents.map((city, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `Квартири под наем без посредник ${city.inPhrase}`,
        url: absoluteUrl(`/kvartiri-bez-posrednik/${city.slug}`),
      })),
    });
    setJsonLd(
      'ld-hub-faq',
      faqJsonLd([
        {
          question: 'Какво означава „квартира под наем без посредник“?',
          answer:
            'Означава, че се свързваш директно със собственика на имота и не плащаш комисион на агенция или брокер.',
        },
        {
          question: 'Плаща ли се комисион?',
          answer:
            'Не. Платформата е създадена само за обяви от собственици, затова тук няма комисиони и такси за оглед.',
        },
        {
          question: 'Как да разпозная брокер, който се представя за собственик?',
          answer:
            'Искане на комисион при оглед, натиск за бързо решение и липса на документ за собственост са основните сигнали. В раздела „Съвети“ има подробен чеклист.',
        },
        {
          question: 'Свободно ли е търсенето?',
          answer:
            'Да, разглеждането и търсенето са свободни за всички. Регистрация е нужна само за връзка със собственик или за публикуване на обява.',
        },
      ]),
    );

    return () => {
      removeJsonLd('ld-breadcrumb-hub');
      removeJsonLd('ld-hub-cities');
      removeJsonLd('ld-hub-faq');
    };
  }, []);

  return (
    <SiteLayout>
      <section className="relative isolate w-full overflow-hidden">
        <div className="absolute inset-0 bg-primary-900">
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/45 to-foreground-950/70" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <nav
            aria-label="breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-background-200"
          >
            <Link to="/" className="transition-colors hover:text-background-50">
              {t('guides.home')}
            </Link>
            <i className="ri-arrow-right-s-line text-sm" aria-hidden="true" />
            <span className="text-background-100">{t('cities.hubCrumb')}</span>
          </nav>

          <h1 className="mt-4 max-w-3xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-background-50 md:text-[46px]">
            Квартири под наем без посредник
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background-100 md:text-base">
            {t('cities.nationalSubtitle')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/tarsene"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
            >
              <i className="ri-search-line text-base" aria-hidden="true" />
              {t('cities.searchAll')}
            </Link>
            <Link
              to="/saveti/kak-da-razpoznam-broker"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-background-50/40 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-background-50/10"
            >
              <i className="ri-shield-check-line text-base" aria-hidden="true" />
              {t('cities.brokerGuide')}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-background-200 bg-background-50">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 py-12 md:grid-cols-3 md:gap-6 md:px-6 md:py-14">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="rounded-lg border border-background-200 bg-background-100 p-5 md:p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <i
                  className={
                    index === 1
                      ? 'ri-money-euro-circle-line text-xl'
                      : index === 2
                        ? 'ri-verified-badge-line text-xl'
                        : 'ri-flag-2-line text-xl'
                  }
                  aria-hidden="true"
                />
              </span>
              <h2 className="mt-4 font-heading text-base font-bold text-foreground-950">
                {t(`cities.why${index}Title`)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-700">
                {t(`cities.why${index}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <CityDirectory
            cities={cityContents}
            title={t('cities.browseTitle')}
            subtitle={t('cities.browseSubtitle')}
          />
        </div>
      </section>

      <section className="border-y border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground-950 md:text-3xl">
                {t('cities.stepsTitle')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground-700">
                {t('cities.stepsText')}
              </p>
              <Link
                to="/kak-raboti"
                className="mt-5 inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
              >
                {t('cities.howItWorks')}
                <i className="ri-arrow-right-line text-base" aria-hidden="true" />
              </Link>
            </div>
            <ol className="space-y-4">
              {[1, 2, 3].map((index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 rounded-lg border border-background-200 bg-background-50 p-4 md:p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 font-heading text-sm font-bold text-accent-800">
                    {index}
                  </span>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground-950 md:text-base">
                      {t(`cities.step${index}Title`)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground-700">
                      {t(`cities.step${index}Desc`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-background-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <CityGuides />
        </div>
      </section>

      <section className="border-t border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
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
              to="/tarsene"
              className="mt-5 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 md:mt-0"
            >
              <i className="ri-search-line text-base" aria-hidden="true" />
              {t('cities.ctaButton')}
            </Link>
          </div>
        </div>
      </section>
    <p className="mt-5 text-xs text-foreground-600">Квартали: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors, ODbL</a>. Каталогът може да е непълен; <a href="/kontakti" className="underline">предложи корекция</a>.</p>
</SiteLayout>
  );
}