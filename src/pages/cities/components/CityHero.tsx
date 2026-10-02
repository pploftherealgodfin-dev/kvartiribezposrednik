import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CityContent } from '@/pages/cities/data';

interface CityHeroProps {
  city: CityContent;
  listingCount: number;
}

export default function CityHero({ city, listingCount }: CityHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="relative isolate w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={city.heroImage}
          alt={`Квартири под наем без посредник ${city.inPhrase}`}
          title={`Квартири под наем без посредник ${city.inPhrase}`}
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/45 to-foreground-950/70" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <nav
          aria-label="breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-background-200"
        >
          <Link to="/" className="transition-colors hover:text-background-50">
            {t('guides.home')}
          </Link>
          <i className="ri-arrow-right-s-line text-sm" aria-hidden="true" />
          <Link to="/kvartiri-bez-posrednik" className="transition-colors hover:text-background-50">
            {t('cities.hubCrumb')}
          </Link>
          <i className="ri-arrow-right-s-line text-sm" aria-hidden="true" />
          <span className="text-background-100">{city.name}</span>
        </nav>

        <h1 className="mt-4 max-w-3xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-background-50 md:text-[44px]">
          Квартири под наем без посредник {city.inPhrase}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background-100 md:text-base">
          {city.intro}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to={`/tarsene?grad=${city.slug}`}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
          >
            <i className="ri-search-line text-base" aria-hidden="true" />
            {t('cities.viewListings')}
          </Link>
          <Link
            to="/kak-raboti"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-background-50/40 px-5 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-background-50/10"
          >
            <i className="ri-information-line text-base" aria-hidden="true" />
            {t('cities.howItWorks')}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-background-200">
          <span className="inline-flex items-center gap-1.5">
            <i className="ri-map-pin-2-line text-sm" aria-hidden="true" />
            {city.region}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="ri-home-4-line text-sm" aria-hidden="true" />
            {listingCount} {t('cities.activeListings')}
          </span>
        </div>
      </div>
    </section>
  );
}