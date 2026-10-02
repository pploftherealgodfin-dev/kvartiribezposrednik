import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LegalShell, { LegalSection } from '@/pages/legal/components/LegalShell';

export default function Accessibility() {
  const { t } = useTranslation();
  const list = 'list-disc space-y-1.5 pl-5 marker:text-foreground-400';

  return (
    <LegalShell
      title={t('a11y.title')}
      description={t('a11y.intro')}
      canonicalPath="/dostapnost"
    >
      {t('a11y.intro')}

      <LegalSection title={t('a11y.s1.title')}>{t('a11y.s1.body')}</LegalSection>
      <LegalSection title={t('a11y.s2.title')}>{t('a11y.s2.body')}</LegalSection>
      <LegalSection title={t('a11y.s3.title')}>{t('a11y.s3.body')}</LegalSection>

      <LegalSection title={t('a11y.s4.title')}>
        <ul className={list}>
          <li>{t('a11y.s4.item1')}</li>
          <li>{t('a11y.s4.item2')}</li>
          <li>{t('a11y.s4.item3')}</li>
          <li>{t('a11y.s4.item4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('a11y.s5.title')}>
        <p>{t('a11y.s5.body')}</p>
        <Link
          to="/kontakti"
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-background-300 px-4 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
        >
          <i className="ri-mail-line text-base" aria-hidden="true" />
          {t('contact.title')}
        </Link>
      </LegalSection>

      <LegalSection title={t('a11y.s6.title')}>{t('a11y.s6.body')}</LegalSection>
    </LegalShell>
  );
}