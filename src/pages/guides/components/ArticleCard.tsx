import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Guide } from '@/pages/guides/data/types';

interface ArticleCardProps {
  guide: Guide;
}

export default function ArticleCard({ guide }: ArticleCardProps) {
  const { t } = useTranslation();

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-background-200 bg-background-50 transition-colors hover:border-primary-400">
      <Link
        to={`/saveti/${guide.slug}`}
        className="block h-44 w-full overflow-hidden bg-background-200"
        aria-label={guide.title}
      >
        <img
          src={guide.heroImage}
          alt={guide.title}
          title={`${guide.title} — ${t('brand.name')}`}
          className="h-full w-full object-cover object-top"
        />
      </Link>

      <p className="px-4 pt-2 text-[10px] leading-none text-foreground-500 md:px-5">
        {guide.heroImageCredit}
      </p>

      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-900">
            {guide.category}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-foreground-500">
            <i className="ri-time-line text-xs" aria-hidden="true" />
            {guide.readingMinutes} {t('guides.readingTime')}
          </span>
        </div>

        <h3 className="font-heading text-base font-bold leading-snug text-foreground-950">
          <Link to={`/saveti/${guide.slug}`} className="transition-colors hover:text-primary-700">
            {guide.title}
          </Link>
        </h3>

        <p className="text-sm leading-relaxed text-foreground-600">{guide.excerpt}</p>

        <Link
          to={`/saveti/${guide.slug}`}
          className="mt-auto inline-flex items-center gap-1.5 whitespace-nowrap pt-1 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
        >
          {t('guides.readMore')}
          <i className="ri-arrow-right-line text-base" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}