import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { guides } from '@/pages/guides/data';
import ArticleCard from '@/pages/guides/components/ArticleCard';

export default function GuidesTeaser() {
  const { t } = useTranslation();
  const items = guides.slice(0, 3);

  return (
    <section className="border-y border-background-200 bg-background-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
              {t('home.guidesEyebrow')}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold leading-tight tracking-tight text-foreground-950 md:text-3xl">
              {t('home.guidesTitle')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-600">
              {t('home.guidesSubtitle')}
            </p>
          </div>
          <Link
            to="/saveti"
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
          >
            {t('home.viewAll')}
            <i className="ri-arrow-right-line text-base" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((guide) => (
            <ArticleCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  );
}