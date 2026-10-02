import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const FORBIDDEN = ['policy.forbidden1', 'policy.forbidden2', 'policy.forbidden3', 'policy.forbidden4'];
const ALLOWED = ['policy.allowed1', 'policy.allowed2', 'policy.allowed3', 'policy.allowed4'];

export default function BrokerTeaser() {
  const { t } = useTranslation();

  return (
    <section className="bg-primary-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="text-sm font-semibold text-accent-400">{t('policy.eyebrow')}</p>
            <h2 className="mt-3 font-heading text-2xl font-semibold leading-tight tracking-tight text-background-50 md:text-4xl">
              {t('policy.title')}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-background-300">
              {t('policy.text')}
            </p>
            <Link
              to="/kak-da-razpoznaem-posrednik"
              className="mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-accent-500 px-4 py-2.5 text-sm font-semibold text-foreground-950 transition-colors hover:bg-accent-400"
            >
              {t('policy.link')}
              <i className="ri-arrow-right-line text-base" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-background-50/15 p-5">
              <h3 className="text-sm font-semibold text-background-100">
                {t('policy.forbiddenTitle')}
              </h3>
              <ul className="mt-4 space-y-3">
                {FORBIDDEN.map((key) => (
                  <li key={key} className="flex items-start gap-3 text-sm leading-snug text-background-300">
                    <i className="ri-subtract-line mt-0.5 text-base text-background-500" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-accent-500/40 p-5">
              <h3 className="text-sm font-semibold text-accent-400">
                {t('policy.allowedTitle')}
              </h3>
              <ul className="mt-4 space-y-3">
                {ALLOWED.map((key) => (
                  <li key={key} className="flex items-start gap-3 text-sm leading-snug text-background-200">
                    <i className="ri-check-line mt-0.5 text-base text-accent-400" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}