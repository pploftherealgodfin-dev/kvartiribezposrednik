import { useTranslation } from 'react-i18next';
import LegalShell, { LegalSection } from '@/pages/legal/components/LegalShell';

export default function Terms() {
  const { t } = useTranslation();
  const list = 'list-disc space-y-1.5 pl-5 marker:text-foreground-400';

  return (
    <LegalShell
      title={t('terms.title')}
      description={t('terms.intro')}
      canonicalPath="/obshi-usloviya"
    >
      {t('terms.intro')}

      <LegalSection title={t('terms.s1.title')}>{t('terms.s1.body')}</LegalSection>
      <LegalSection title={t('terms.s2.title')}>{t('terms.s2.body')}</LegalSection>
      <LegalSection title={t('terms.s3.title')}>{t('terms.s3.body')}</LegalSection>

      <LegalSection title={t('terms.s4.title')}>
        <ul className={list}>
          <li>{t('terms.s4.item1')}</li>
          <li>{t('terms.s4.item2')}</li>
          <li>{t('terms.s4.item3')}</li>
          <li>{t('terms.s4.item4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('terms.s5.title')}>{t('terms.s5.body')}</LegalSection>
      <LegalSection title={t('terms.s6.title')}>{t('terms.s6.body')}</LegalSection>
      <LegalSection title={t('terms.s7.title')}>{t('terms.s7.body')}</LegalSection>
      <LegalSection title={t('terms.s8.title')}>{t('terms.s8.body')}</LegalSection>
      <LegalSection title={t('terms.s9.title')}>{t('terms.s9.body')}</LegalSection>
      <LegalSection title={t('terms.s10.title')}>{t('terms.s10.body')}</LegalSection>
    </LegalShell>
  );
}