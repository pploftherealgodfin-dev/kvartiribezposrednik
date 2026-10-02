import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { guides } from '@/pages/guides/data';
import ArticleCard from '@/pages/guides/components/ArticleCard';

export default function CityGuides() {
  const { t } = useTranslation();
  const items = guides.slice(0, 3);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground-950 md:text-3xl">
            {t('cities.guidesTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground-600">{t('cities.guidesSubtitle')}</p>
        </div>
        <Link
          to="/saveti"
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
        >
          {t('home.viewAll')}
          <i className="ri-arrow-right-line text-base" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((guide) => (
          <ArticleCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </div>
  );
}