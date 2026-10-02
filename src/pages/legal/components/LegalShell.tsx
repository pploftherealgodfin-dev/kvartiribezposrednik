import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { applyPageMeta } from '@/lib/seo';

interface LegalShellProps {
  title: string;
  description: string;
  canonicalPath: string;
  children: ReactNode;
}

/**
 * Обща обвивка за всички правни страници — единен вид, заглавие и SEO.
 */
export default function LegalShell({
  title,
  description,
  canonicalPath,
  children,
}: LegalShellProps) {
  const { t } = useTranslation();

  useEffect(() => {
    applyPageMeta({
      title: `${title} | ${t('brand.name')}`,
      description,
      canonicalPath,
    });
  }, [title, description, canonicalPath, t]);

  return (
    <SiteLayout>
      <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-medium text-foreground-500">
          {t('legal.updated')}: {t('legal.updatedDate')}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold leading-tight text-foreground-950 md:text-4xl">
          {title}
        </h1>
        <div className="mt-10 space-y-9">{children}</div>
      </article>
    </SiteLayout>
  );
}

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="font-heading text-lg font-bold text-foreground-950 md:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground-700 md:text-[15px]">
        {children}
      </div>
    </section>
  );
}
import '@/i18n/legal';
