import { useTranslation } from 'react-i18next';
import LegalShell, { LegalSection } from '@/pages/legal/components/LegalShell';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const list = 'list-disc space-y-1.5 pl-5 marker:text-foreground-400';

  return (
    <LegalShell
      title={t('privacy.title')}
      description={t('privacy.intro')}
      canonicalPath="/politika-za-poveritelnost"
    >
      {t('privacy.intro')}

      <LegalSection title={t('privacy.s1.title')}>{t('privacy.s1.body')}</LegalSection>

      <LegalSection title={t('privacy.s2.title')}>
        <ul className={list}>
          <li>{t('privacy.s2.item1')}</li>
          <li>{t('privacy.s2.item2')}</li>
          <li>{t('privacy.s2.item3')}</li>
          <li>{t('privacy.s2.item4')}</li>
          <li>{t('privacy.s2.item5')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('privacy.s3.title')}>
        <ul className={list}>
          <li>{t('privacy.s3.item1')}</li>
          <li>{t('privacy.s3.item2')}</li>
          <li>{t('privacy.s3.item3')}</li>
          <li>{t('privacy.s3.item4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('privacy.s4.title')}>{t('privacy.s4.body')}</LegalSection>
      <LegalSection title={t('privacy.s5.title')}>{t('privacy.s5.body')}</LegalSection>
      <LegalSection title={t('privacy.s6.title')}>{t('privacy.s6.body')}</LegalSection>
      <LegalSection title={t('privacy.s7.title')}>{t('privacy.s7.body')}</LegalSection>

      <LegalSection title={t('privacy.s8.title')}>
        <ul className={list}>
          <li>{t('privacy.s8.item1')}</li>
          <li>{t('privacy.s8.item2')}</li>
          <li>{t('privacy.s8.item3')}</li>
          <li>{t('privacy.s8.item4')}</li>
          <li>{t('privacy.s8.item5')}</li>
          <li>{t('privacy.s8.item6')}</li>
        </ul>
        <p>{t('privacy.s8.note')}</p>
      </LegalSection>

      <LegalSection title={t('privacy.s9.title')}>{t('privacy.s9.body')}</LegalSection>
      <LegalSection title={t('privacy.s10.title')}>{t('privacy.s10.body')}</LegalSection>
    </LegalShell>
  );
}