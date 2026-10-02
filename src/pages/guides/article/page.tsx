import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import {
  applyPageMeta,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  removeJsonLd,
  setJsonLd,
} from '@/lib/seo';
import { getGuide, getRelatedGuides } from '@/pages/guides/data';
import GuideBody from '@/pages/guides/components/GuideBody';
import ArticleCard from '@/pages/guides/components/ArticleCard';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function GuideArticlePage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const guide = slug ? getGuide(slug) : undefined;

  useEffect(() => {
    if (!guide) {
      applyPageMeta({
        title: `Страницата не е намерена | ${t('brand.name')}`,
        robots: 'noindex, follow',
      });
      return undefined;
    }

    const path = `/saveti/${guide.slug}`;
    applyPageMeta({
      title: `${guide.title} | ${t('brand.name')}`,
      description: guide.excerpt,
      canonicalPath: path,
      ogType: 'article',
      ogImage: guide.heroImage,
    });

    setJsonLd(
      'ld-article',
      articleJsonLd({
        title: guide.title,
        description: guide.excerpt,
        path,
        image: guide.heroImage,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        keywords: guide.keywords,
      }),
    );
    setJsonLd(
      'ld-breadcrumb-article',
      breadcrumbJsonLd([
        { name: 'Начало', path: '/' },
        { name: 'Съвети', path: '/saveti' },
        { name: guide.title, path },
      ]),
    );
    if (guide.faq && guide.faq.length > 0) {
      setJsonLd('ld-faq-article', faqJsonLd(guide.faq));
    }

    return () => {
      removeJsonLd('ld-article');
      removeJsonLd('ld-breadcrumb-article');
      removeJsonLd('ld-faq-article');
    };
  }, [guide, t]);

  if (!guide) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center md:px-6">
          <h1 className="font-heading text-2xl font-bold text-foreground-950">
            {t('guides.notFound')}
          </h1>
          <Link
            to="/saveti"
            className="mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
          >
            <i className="ri-arrow-left-line text-base" aria-hidden="true" />
            {t('guides.backToGuides')}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const related = getRelatedGuides(guide.slug);

  return (
    <SiteLayout>
      <article>
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 md:px-6 md:pt-10">
          <nav
            aria-label="breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-foreground-500"
          >
            <Link to="/" className="transition-colors hover:text-primary-700">
              {t('guides.home')}
            </Link>
            <i className="ri-arrow-right-s-line text-sm" aria-hidden="true" />
            <Link to="/saveti" className="transition-colors hover:text-primary-700">
              {t('guides.title')}
            </Link>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="whitespace-nowrap rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-900">
              {guide.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-foreground-500">
              <i className="ri-time-line text-sm" aria-hidden="true" />
              {guide.readingMinutes} {t('guides.readingTime')}
            </span>
            <span className="flex items-center gap-1 text-xs text-foreground-500">
              <i className="ri-calendar-line text-sm" aria-hidden="true" />
              {formatDate(guide.updatedAt)}
            </span>
          </div>

          <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground-950 md:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground-600 md:text-lg">
            {guide.excerpt}
          </p>
        </div>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-12">
          <GuideBody guide={guide} />

          {guide.faq && guide.faq.length > 0 && (
            <section className="mt-12">
              <h2 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
                {t('guides.faqTitle')}
              </h2>
              <div className="mt-5 space-y-4">
                {guide.faq.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-lg border border-background-200 bg-background-100 p-4 md:p-5"
                  >
                    <h3 className="font-heading text-sm font-bold text-foreground-950 md:text-base">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-700">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-6 md:flex md:items-center md:justify-between md:gap-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground-950 md:text-xl">
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
      </article>

      {related.length > 0 && (
        <div className="border-t border-background-200 bg-background-100">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-14">
            <h2 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
              {t('guides.relatedTitle')}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.slug} guide={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}