import { useTranslation } from 'react-i18next';
import LegalShell, { LegalSection } from '@/pages/legal/components/LegalShell';
import { openConsentSettings } from '@/lib/consent';

export default function CookiePolicy() {
  const { t } = useTranslation();
  const list = 'list-disc space-y-1.5 pl-5 marker:text-foreground-400';

  return (
    <LegalShell
      title={t('cookies.title')}
      description={t('cookies.intro')}
      canonicalPath="/biskvitki"
    >
      {t('cookies.intro')}

      <LegalSection title={t('cookies.s1.title')}>{t('cookies.s1.body')}</LegalSection>

      <LegalSection title={t('cookies.s2.title')}>
        <ul className={list}>
          <li>{t('cookies.s2.item1')}</li>
          <li>{t('cookies.s2.item2')}</li>
          <li>{t('cookies.s2.item3')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('cookies.s3.title')}>
        <p>{t('cookies.s3.body')}</p>
        <button
          type="button"
          onClick={openConsentSettings}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
        >
          <i className="ri-equalizer-line text-base" aria-hidden="true" />
          {t('consent.settings')}
        </button>
      </LegalSection>

      <LegalSection title={t('cookies.s4.title')}>
        <ul className={list}>
          <li>{t('cookies.s4.item1')}</li>
          <li>{t('cookies.s4.item2')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('cookies.s5.title')}>{t('cookies.s5.body')}</LegalSection>
    </LegalShell>
  );
}