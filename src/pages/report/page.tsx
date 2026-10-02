import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { applyPageMeta } from '@/lib/seo';

const ENDPOINT = 'https://readdy.ai/api/form/daujbb32asjjtt1skm7g';

const labelCls = 'block text-sm font-semibold text-foreground-900';
const fieldCls =
  'mt-1.5 w-full rounded-md border border-background-300 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 transition-colors placeholder:text-foreground-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400/40';

export default function ReportContent() {
  const { t } = useTranslation();
  const [details, setDetails] = useState('');
  const { status, error, submit } = useFormSubmit({
    endpoint: ENDPOINT,
    honeypotField: 'website_alt',
    genericError: t('report.error'),
  });

  useEffect(() => {
    applyPageMeta({
      title: `${t('report.title')} | ${t('brand.name')}`,
      description: t('report.intro'),
      canonicalPath: '/dokladvane',
    });
  }, [t]);

  useEffect(() => {
    if (status === 'success') setDetails('');
  }, [status]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget);
  };

  const submitting = status === 'submitting';

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <h1 className="font-heading text-3xl font-extrabold leading-tight text-foreground-950 md:text-4xl">
          {t('report.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-600 md:text-[15px]">
          {t('report.intro')}
        </p>

        {status === 'success' ? (
          <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-background-50">
              <i className="ri-check-line text-2xl" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium text-foreground-800">{t('report.success')}</p>
            <Link
              to="/"
              className="mt-5 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-background-300 px-4 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
            >
              <i className="ri-arrow-left-line text-base" aria-hidden="true" />
              {t('legal.backHome')}
            </Link>
          </div>
        ) : (
          <form
            id="dsa-report-form"
            data-readdy-form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5 rounded-lg border border-background-200 bg-background-100 p-5 md:p-6"
          >
            <div>
              <label className={labelCls} htmlFor="report-reason">
                {t('report.reason')}
              </label>
              <select
                id="report-reason"
                name="reason"
                className={fieldCls}
                defaultValue="broker"
                required
              >
                <option value="broker">{t('report.reasonBroker')}</option>
                <option value="fake">{t('report.reasonFake')}</option>
                <option value="rented">{t('report.reasonRented')}</option>
                <option value="wrong_info">{t('report.reasonWrongInfo')}</option>
                <option value="other">{t('report.reasonOther')}</option>
              </select>
            </div>

            <div>
              <label className={labelCls} htmlFor="report-listing-url">
                {t('report.listingUrl')}
              </label>
              <input
                id="report-listing-url"
                name="listing_url"
                type="url"
                inputMode="url"
                placeholder="https://"
                className={fieldCls}
              />
              <p className="mt-1.5 text-xs text-foreground-500">{t('report.listingUrlHint')}</p>
            </div>

            <div>
              <label className={labelCls} htmlFor="report-details">
                {t('report.details')}
              </label>
              <textarea
                id="report-details"
                name="details"
                maxLength={500}
                rows={5}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                className={`${fieldCls} resize-y`}
                required
              />
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="text-xs text-foreground-500">{t('report.detailsHint')}</p>
                <p className="shrink-0 text-xs text-foreground-500">
                  {details.length}/500 {t('form.charCount')}
                </p>
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="report-email">
                {t('report.email')}
              </label>
              <input
                id="report-email"
                name="email"
                type="email"
                autoComplete="email"
                className={fieldCls}
              />
              <p className="mt-1.5 text-xs text-foreground-500">{t('report.emailHint')}</p>
            </div>

            <input
              type="text"
              name="website_alt"
              className="hp-field"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              readOnly
            />

            {status === 'error' && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md border border-background-300 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900"
              >
                <i
                  className="ri-error-warning-line mt-0.5 text-base text-foreground-600"
                  aria-hidden="true"
                />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              <i
                className={submitting ? 'ri-loader-4-line animate-spin text-base' : 'ri-send-plane-line text-base'}
                aria-hidden="true"
              />
              {t('report.submit')}
            </button>
          </form>
        )}

        <p className="mt-6 text-xs leading-relaxed text-foreground-500">{t('report.anonymousNote')}</p>
      </div>
    </SiteLayout>
  );
}