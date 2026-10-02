import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LegalShell, { LegalSection } from '@/pages/legal/components/LegalShell';

export default function ContentPolicy() {
  const { t } = useTranslation();
  const list = 'list-disc space-y-1.5 pl-5 marker:text-foreground-400';

  return (
    <LegalShell
      title={t('dsa.title')}
      description={t('dsa.intro')}
      canonicalPath="/pravila-za-sadarzhanie"
    >
      {t('dsa.intro')}

      <LegalSection title="Публикуване в пилотния режим">
        <p>Всеки акаунт има една текуща обява за директно отдаване без посредническа комисиона. Наетите, изтеклите, отхвърлените и деактивираните обяви се редактират или подновяват от същия запис. Премахнатите от екипа записи остават като история.</p>
        <p className="mt-3">Нужни са активен акаунт, реални снимки и преглед на съдържанието. Документната проверка е по желание; одобрението за публикуване не удостоверява собственост. След редакция обявата чака нов преглед. Не включвай лични данни или контакти в публичния текст и снимки.</p>
        <Link className="mt-3 inline-flex text-primary-700 underline" to="/saveti/naemodatel-bez-agencia">Насоки за снимки, цена и подготовка</Link>
      </LegalSection>

      <LegalSection title={t('dsa.s1.title')}>{t('dsa.s1.body')}</LegalSection>

      <LegalSection title={t('dsa.s2.title')}>
        <ul className={list}>
          <li>{t('dsa.s2.item1')}</li>
          <li>{t('dsa.s2.item2')}</li>
          <li>{t('dsa.s2.item3')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('dsa.s3.title')}>
        <p>{t('dsa.s3.body')}</p>
        <Link
          to="/dokladvane"
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
        >
          <i className="ri-flag-line text-base" aria-hidden="true" />
          {t('report.title')}
        </Link>
      </LegalSection>

      <LegalSection title={t('dsa.s4.title')}>{t('dsa.s4.body')}</LegalSection>
      <LegalSection title={t('dsa.s5.title')}>{t('dsa.s5.body')}</LegalSection>
      <LegalSection title={t('dsa.s6.title')}>{t('dsa.s6.body')}</LegalSection>
      <LegalSection title={t('dsa.s7.title')}>{t('dsa.s7.body')}</LegalSection>
    </LegalShell>
  );
}
