import { useTranslation } from 'react-i18next';
import LegalShell, { LegalSection } from '@/pages/legal/components/LegalShell';

export default function LegalNotice() {
  const { t } = useTranslation();

  return (
    <LegalShell
      title={t('notice.title')}
      description={t('notice.intro')}
      canonicalPath="/pravna-informaciya"
    >
      {t('notice.intro')}

      <LegalSection title={t('notice.s1.title')}>{t('notice.s1.body')}</LegalSection>
      <LegalSection title={t('notice.s2.title')}>{t('notice.s2.body')}</LegalSection>
      <LegalSection title={t('notice.s3.title')}>{t('notice.s3.body')}</LegalSection>
      <LegalSection title={t('notice.s4.title')}>{t('notice.s4.body')}</LegalSection>
      <LegalSection title={t('notice.s5.title')}>{t('notice.s5.body')}</LegalSection>
      <LegalSection title={t('notice.s6.title')}>{t('notice.s6.body')}</LegalSection>
    </LegalShell>
  );
}