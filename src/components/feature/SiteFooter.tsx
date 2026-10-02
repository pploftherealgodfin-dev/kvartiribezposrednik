import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openConsentSettings } from '@/lib/consent';
import { BRAND_LOGO } from '@/lib/seo';

const POPULAR_CITIES = [
  { slug: 'sofia', name: 'София' },
  { slug: 'plovdiv', name: 'Пловдив' },
  { slug: 'varna', name: 'Варна' },
  { slug: 'burgas', name: 'Бургас' },
  { slug: 'ruse', name: 'Русе' },
  { slug: 'stara-zagora', name: 'Стара Загора' },
];

const POPULAR_NEIGHBORHOODS = [
  { city: 'sofia', slug: 'studentski-grad', name: 'Студентски град' },
  { city: 'sofia', slug: 'lozenets', name: 'Лозенец' },
  { city: 'sofia', slug: 'mladost-1', name: 'Младост 1' },
  { city: 'sofia', slug: 'centar', name: 'Център, София' },
  { city: 'plovdiv', slug: 'karshiyaka', name: 'Кършияка' },
  { city: 'varna', slug: 'chayka', name: 'Чайка' },
];

const INFO_PAGES = [
  { to: '/za-nas', label: 'За нас' },
  { to: '/saveti', label: 'Съвети и ръководства' },
  { to: '/kak-raboti', label: 'Как работи' },
  { to: '/kak-da-razpoznaem-posrednik', label: 'Как да разпознаем посредник' },
  { to: '/faq', label: 'Често задавани въпроси' },
];

const LEGAL_LINKS = [
  { to: '/pravila-za-sadarzhanie', key: 'legal.nav.contentPolicy' },
  { to: '/politika-za-poveritelnost', key: 'legal.nav.privacy' },
  { to: '/obshi-usloviya', key: 'legal.nav.terms' },
  { to: '/biskvitki', key: 'legal.nav.cookies' },
  { to: '/pravna-informaciya', key: 'legal.nav.notice' },
  { to: '/dostapnost', key: 'legal.nav.accessibility' },
  { to: '/dokladvane', key: 'legal.nav.report' },
];

export default function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary-950 text-background-100">
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 md:px-6 md:pt-16">
        <p className="max-w-2xl font-heading text-2xl font-semibold leading-snug text-background-50 md:text-[30px]">
          {t('footer.tagline')}
        </p>

        <div className="mt-10 grid w-full grid-cols-1 gap-8 border-t border-background-50/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-background-50">{t('footer.cities')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {POPULAR_CITIES.map((city) => (
                <li key={city.slug}>
                  <Link
                    className="text-background-300 transition-colors hover:text-background-50"
                    to={`/kvartiri-bez-posrednik/${city.slug}`}
                  >
                    Квартири под наем в {city.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  className="font-semibold text-background-100 transition-colors hover:text-background-50"
                  to="/kvartiri-bez-posrednik"
                >
                  Всички градове
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-background-50">{t('footer.neighborhoods')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {POPULAR_NEIGHBORHOODS.map((item) => (
                <li key={`${item.city}-${item.slug}`}>
                  <Link
                    className="text-background-300 transition-colors hover:text-background-50"
                    to={`/tarsene?grad=${item.city}&kvartal=${item.slug}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-background-50">{t('footer.info')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {INFO_PAGES.map((page) => (
                <li key={page.to}>
                  <Link
                    className="text-background-300 transition-colors hover:text-background-50"
                    to={page.to}
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-background-50">{t('footer.contacts')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-background-300">
              <li className="flex items-center gap-2">
                <i className="ri-mail-line text-base" aria-hidden="true" />
                {t('legal.operatorEmail')}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-phone-line text-base" aria-hidden="true" />
                {t('legal.operatorPhone')}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-map-pin-2-line text-base" aria-hidden="true" />
                {t('legal.operatorAddress')}
              </li>
            </ul>
            <Link
              to="/kontakti"
              className="mt-5 inline-flex whitespace-nowrap rounded-md border border-background-50/25 px-4 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-background-50/10"
            >
              {t('contact.title')}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-background-50/10">
        <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-8 md:px-6 md:pb-8">
          <nav
            aria-label={t('footer.legal')}
            className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="whitespace-nowrap text-background-300 transition-colors hover:text-background-50"
              >
                {t(link.key)}
              </Link>
            ))}
            <button
              type="button"
              onClick={openConsentSettings}
              className="cursor-pointer whitespace-nowrap text-background-300 underline underline-offset-2 transition-colors hover:text-background-50"
            >
              {t('footer.cookieSettings')}
            </button>
          </nav>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-background-50/10 pt-6 text-center sm:flex-row sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg ring-1 ring-background-50/15">
                <img
                  src={BRAND_LOGO}
                  alt={t('brand.name')}
                  title={`${t('brand.name')} — наем без посредник`}
                  className="h-full w-full object-cover"
                />
              </span>
              <p className="font-body text-sm font-semibold text-background-200">{t('brand.name')}</p>
            </div>
            <p className="text-xs text-background-400">
              © {new Date().getFullYear()} {t('brand.name')}. {t('footer.rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}