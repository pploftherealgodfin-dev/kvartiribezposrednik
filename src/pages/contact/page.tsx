import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { applyPageMeta } from '@/lib/seo';

const ENDPOINT = 'https://readdy.ai/api/form/daujbb32asjjtt1skm70';

const labelCls = 'block text-sm font-semibold text-foreground-900';
const fieldCls =
  'mt-1.5 w-full rounded-md border border-background-300 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 transition-colors placeholder:text-foreground-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400/40';

export default function Contact() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const { status, error, submit, reset } = useFormSubmit({
    endpoint: ENDPOINT,
    honeypotField: 'contact_alt',
    genericError: t('contact.error'),
  });

  useEffect(() => {
    applyPageMeta({
      title: `${t('contact.title')} | ${t('brand.name')}`,
      description: t('contact.intro'),
      canonicalPath: '/kontakti',
    });
  }, [t]);

  useEffect(() => {
    if (status === 'success') setMessage('');
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
          {t('contact.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-600 md:text-[15px]">
          {t('contact.intro')}
        </p>

        <p className="mt-6 rounded-lg border border-background-200 bg-background-100 p-4 text-sm text-foreground-700">За запитване използвай формата по-долу. Не изпращай пароли, банкови кодове или снимки на документи.</p>

        {status === 'success' ? (
          <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-background-50">
              <i className="ri-check-line text-2xl" aria-hidden="true" />
            </span>
            <p role="status" className="mt-4 text-sm font-medium text-foreground-800">{t('contact.success')}</p><button type="button" onClick={reset} className="ui-secondary mt-4">Ново запитване</button>
          </div>
        ) : (
          <form
            id="contact-form"
            data-readdy-form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5 rounded-lg border border-background-200 bg-background-100 p-5 md:p-6"
          >
            <fieldset disabled={submitting} className="space-y-5"><div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="contact-name">
                  {t('contact.name')}
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={fieldCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="contact-email">
                  {t('contact.email')}
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={fieldCls}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="contact-subject">
                {t('contact.subject')}
              </label>
              <select
                id="contact-subject"
                name="subject"
                className={fieldCls}
                defaultValue="general"
                required
              >
                <option value="general">{t('contact.subjectGeneral')}</option>
                <option value="accessibility">{t('contact.subjectAccessibility')}</option>
                <option value="privacy">{t('contact.subjectPrivacy')}</option>
                <option value="report">{t('contact.subjectReport')}</option>
              </select>
            </div>

            <div>
              <label className={labelCls} htmlFor="contact-message">
                {t('contact.message')}
              </label>
              <textarea
                id="contact-message"
                name="message"
                maxLength={500}
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={`${fieldCls} resize-y`}
                required
              />
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="text-xs text-foreground-500">{t('contact.messageHint')}</p>
                <p className="shrink-0 text-xs text-foreground-500">
                  {message.length}/500 {t('form.charCount')}
                </p>
              </div>
            </div>

            <input
              type="text"
              name="contact_alt"
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
              {submitting ? 'Изпращане…' : t('contact.submit')}
            </button></fieldset>
          </form>
        )}

        <p className="mt-6 text-xs leading-relaxed text-foreground-500">{t('contact.responseNote')}</p>
      </div>
    </SiteLayout>
  );
}
import '@/i18n/legal';
