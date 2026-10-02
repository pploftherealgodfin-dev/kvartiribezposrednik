import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { applyPageMeta } from '@/lib/seo';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  const { t } = useTranslation();

  useEffect(() => {
    applyPageMeta({
      title: `${title} | ${t('brand.name')}`,
      robots: 'noindex, follow',
    });
  }, [title, t]);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-20 md:px-6 md:py-28">
        <div className="rounded-lg border border-background-200/70 bg-background-100 p-6 text-center md:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-800">
            <i className="ri-tools-line text-2xl" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-extrabold text-foreground-950 md:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-foreground-600">
            Тази страница се изгражда в следващата фаза от плана.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}