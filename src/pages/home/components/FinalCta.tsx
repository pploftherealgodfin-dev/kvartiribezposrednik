import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function FinalCta() {
  const { t } = useTranslation();

  return (
    <section className="bg-background-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-primary-600 px-6 py-10 md:flex-row md:items-center md:px-10">
          <div>
            <h2 className="max-w-xl font-heading text-2xl font-extrabold leading-tight tracking-tight text-background-50 md:text-3xl">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-background-100">
              {t('home.ctaText')}
            </p>
          </div>
          <Link
            to="/kachi-obiava"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-background-50 px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-background-100"
          >
            <i className="ri-add-circle-line text-lg" />
            {t('home.ctaButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}