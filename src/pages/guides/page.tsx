import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { applyPageMeta, breadcrumbJsonLd, setJsonLd } from '@/lib/seo';
import { guides } from '@/pages/guides/data';
import ArticleCard from '@/pages/guides/components/ArticleCard';

export default function GuidesPage() {
  const { t } = useTranslation();

  useEffect(() => {
    applyPageMeta({
      title: `Съвети за наем без посредник | ${t('brand.name')}`,
      description:
        'Практични ръководства за наематели и собственици: как да разпознаеш брокер, как минава оглед и договор, кои такси са реални и как да отдадеш сам.',
      canonicalPath: '/saveti',
    });
    setJsonLd(
      'ld-breadcrumb-guides',
      breadcrumbJsonLd([
        { name: 'Начало', path: '/' },
        { name: 'Съвети', path: '/saveti' },
      ]),
    );
  }, [t]);

  return (
    <SiteLayout>
      <div className="border-b border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <nav
            aria-label="breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-foreground-500"
          >
            <Link to="/" className="transition-colors hover:text-primary-700">
              {t('guides.home')}
            </Link>
            <i className="ri-arrow-right-s-line text-sm" aria-hidden="true" />
            <span className="text-foreground-700">{t('guides.title')}</span>
          </nav>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground-950 md:text-4xl">
            {t('guides.heroTitle')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-600 md:text-[15px]">
            {t('guides.heroText')}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <ArticleCard key={guide.slug} guide={guide} />
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-6 md:flex md:items-center md:justify-between md:gap-6 md:p-8">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
              {t('guides.ctaTitle')}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground-700">
              {t('guides.ctaText')}
            </p>
          </div>
          <Link
            to="/tarsene"
            className="mt-5 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 md:mt-0"
          >
            <i className="ri-search-line text-base" aria-hidden="true" />
            {t('guides.ctaButton')}
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}