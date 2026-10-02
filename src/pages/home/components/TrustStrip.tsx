import { useTranslation } from 'react-i18next';

const ITEMS = [
  { titleKey: 'trust.noFee.title', descKey: 'trust.noFee.desc' },
  { titleKey: 'trust.verified.title', descKey: 'trust.verified.desc' },
  { titleKey: 'trust.report.title', descKey: 'trust.report.desc' },
];

export default function TrustStrip() {
  const { t } = useTranslation();

  return (
    <section className="border-b border-background-200 bg-background-50">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-px bg-background-200 sm:grid-cols-3">
        {ITEMS.map((item, index) => (
          <div key={item.titleKey} className="bg-background-50 p-6 md:p-8">
            <span className="font-heading text-2xl font-semibold text-primary-600">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-3 text-base font-semibold text-foreground-950">{t(item.titleKey)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-600">{t(item.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}