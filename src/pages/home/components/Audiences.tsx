import { useTranslation } from 'react-i18next';

const ITEMS = [
  { icon: 'ri-graduation-cap-line', titleKey: 'audience.studentTitle', descKey: 'audience.studentDesc' },
  { icon: 'ri-briefcase-4-line', titleKey: 'audience.youngTitle', descKey: 'audience.youngDesc' },
  { icon: 'ri-parent-line', titleKey: 'audience.familyTitle', descKey: 'audience.familyDesc' },
  { icon: 'ri-key-2-line', titleKey: 'audience.ownerTitle', descKey: 'audience.ownerDesc' },
];

export default function Audiences() {
  const { t } = useTranslation();

  return (
    <section className="bg-background-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <p className="text-sm font-semibold text-primary-700">{t('audience.eyebrow')}</p>
        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground-950 md:text-3xl">
          {t('audience.title')}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-foreground-600">{t('audience.text')}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <div
              key={item.titleKey}
              className="rounded-lg border border-background-200 bg-background-50 p-5 transition-colors hover:border-foreground-300"
            >
              <i className={`${item.icon} text-2xl text-primary-600`} />
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground-950">
                {t(item.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-600">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}