import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type TabKey = 'tenants' | 'owners';

const STEPS: Record<TabKey, { titleKey: string; descKey: string; icon: string }[]> = {
  tenants: [
    { titleKey: 'home.tenantStep1Title', descKey: 'home.tenantStep1Desc', icon: 'ri-search-eye-line' },
    { titleKey: 'home.tenantStep2Title', descKey: 'home.tenantStep2Desc', icon: 'ri-chat-3-line' },
    { titleKey: 'home.tenantStep3Title', descKey: 'home.tenantStep3Desc', icon: 'ri-home-4-line' },
  ],
  owners: [
    { titleKey: 'home.ownerStep1Title', descKey: 'home.ownerStep1Desc', icon: 'ri-user-add-line' },
    { titleKey: 'home.ownerStep2Title', descKey: 'home.ownerStep2Desc', icon: 'ri-add-circle-line' },
    { titleKey: 'home.ownerStep3Title', descKey: 'home.ownerStep3Desc', icon: 'ri-notification-3-line' },
  ],
};

export default function HowItWorks() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('tenants');

  const tabs: { key: TabKey; labelKey: string }[] = [
    { key: 'tenants', labelKey: 'home.tabTenants' },
    { key: 'owners', labelKey: 'home.tabOwners' },
  ];

  return (
    <section className="border-y border-background-200/70 bg-background-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground-950 md:text-3xl">
            {t('home.howItWorksTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-foreground-600">
            {t('home.howItWorksSubtitle')}
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-full border border-background-300 bg-background-50 p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`cursor-pointer whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  tab === item.key
                    ? 'bg-primary-600 text-background-50'
                    : 'text-foreground-700 hover:text-foreground-950'
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS[tab].map((step, index) => (
            <div
              key={step.titleKey}
              className="relative rounded-lg border border-background-200/70 bg-background-50 p-5"
            >
              <span className="absolute right-5 top-5 font-heading text-3xl font-semibold text-background-300">
                {index + 1}
              </span>
              <i className={`${step.icon} text-2xl text-primary-600`} />
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground-950">
                {t(step.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-600">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}