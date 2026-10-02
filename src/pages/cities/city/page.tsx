import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { repository } from '@/lib/repository';
import { applyPageMeta, removeJsonLd, setJsonLd } from '@/lib/seo';
import { getPageMeta } from '@/lib/pageCatalog';
import type { ListingView } from '@/lib/types';
import { getCityContent, getOtherCities } from '@/pages/cities/data';
import { cityJsonLd } from '@/pages/cities/data/structuredData';
import CityHero from '@/pages/cities/components/CityHero';
import CityListings from '@/pages/cities/components/CityListings';
import CityFacts from '@/pages/cities/components/CityFacts';
import CityFaq from '@/pages/cities/components/CityFaq';
import { CityAreas, CityUniversities } from '@/pages/cities/components/CityLocations';
import CityGuides from '@/pages/cities/components/CityGuides';
import RentalPreparation from '@/pages/cities/components/RentalPreparation';

export default function CityLandingPage() {
  const { grad } = useParams();
  const content = getCityContent(grad);
  const [listings, setListings] = useState<ListingView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    applyPageMeta(getPageMeta(`/kvartiri-bez-posrednik/${grad}`));
    if (content) setJsonLd('ld-city', cityJsonLd(content));
    return () => removeJsonLd('ld-city');
  }, [content, grad]);
  useEffect(() => {
    if (!content) { setLoading(false); return; }
    let active = true;
    setLoading(true); setError(false); setListings([]); setTotal(0);
    repository.search({ filters: { citySlug: content.slug, type: 'all' }, sort: 'newest', page: 1, pageSize: 6 })
      .then(result => { if (active) { setListings(result.items); setTotal(result.total); } })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [content, reloadKey]);
  const retry = useCallback(() => setReloadKey(key => key + 1), []);
  if (!content) return <SiteLayout><div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="font-heading text-2xl font-semibold">Градът не е намерен</h1><p className="mt-3 text-sm text-foreground-600">Избери град от националния каталог.</p><Link to="/kvartiri-bez-posrednik" className="ui-button mt-6">Виж всички градове</Link></div></SiteLayout>;
  const otherCities = getOtherCities(content.slug);
  return <SiteLayout>
    <CityHero city={content} listingCount={loading || error ? null : total} />
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:space-y-16 md:px-6 md:py-14">
      <section id="obavi" tabIndex={-1} className="outline-none"><CityListings cityName={content.label} citySlug={content.slug} listings={listings} total={total} loading={loading} error={error} onRetry={retry} /></section>
      <CityFacts city={content} />
      <div className={`grid gap-10 ${content.local.universities.length ? 'lg:grid-cols-2' : ''}`}><CityAreas key={content.slug} city={content} />{content.local.universities.length > 0 && <CityUniversities city={content} />}</div>
      <RentalPreparation key={`budget-${content.slug}`} />
      <section id="blizki-gradove" tabIndex={-1} className="outline-none"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-heading text-2xl font-semibold">{content.local.lat != null ? 'Близки градове за сравнение' : `Други градове в област ${content.region}`}</h2><p className="mt-3 text-sm leading-relaxed text-foreground-600">{content.local.lat != null ? 'Разстоянията са приблизителни по права линия между градски точки, а не маршрути или време за пътуване.' : 'Няма проверена координата за този град. Показваме градове от същата област, без изчислени разстояния.'}</p></div><Link to="/kvartiri-bez-posrednik" className="inline-flex min-h-11 items-center text-sm font-medium text-primary-700">Всички градове</Link></div><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{otherCities.map(city => <li key={city.slug}><Link to={`/kvartiri-bez-posrednik/${city.slug}`} className="flex h-full min-h-16 items-center justify-between gap-3 rounded-xl border border-background-200 px-4 py-3 hover:border-primary-300 hover:bg-primary-50"><div><p className="text-sm font-semibold">{city.label}</p><p className="ui-note mt-1">Област {city.region}{city.distanceKm != null ? ` · ≈ ${city.distanceKm.toLocaleString('bg-BG')} км по права линия` : ''}</p></div><i className="ri-arrow-right-line text-foreground-500" aria-hidden="true" /></Link></li>)}</ul></section>
      <section id="vuprosi" tabIndex={-1} className="outline-none"><CityFaq items={content.faq} title="Полезни въпроси" /></section>
      <CityGuides />
      <section id="iztochnici" tabIndex={-1} className="outline-none"><details className="rounded-xl border border-background-200 bg-background-100 px-5"><summary className="py-4 font-medium">Източници, покритие и корекции</summary><div className="space-y-3 pb-5 text-sm leading-relaxed text-foreground-700"><p>Местен каталог: {content.updatedAt}. Наличността и условията на обявите се зареждат отделно и могат да се променят.</p><ul className="space-y-2"><li><a href="https://www.nsi.bg/nrnm/ekatte/index" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">НСИ — ЕКАТТЕ</a>: град, област и код {content.local.ekatte}.</li><li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">© OpenStreetMap contributors</a>: райони и градски точки, лиценз <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer" className="underline">ODbL</a>. {content.local.coordinateSource && <a href={content.local.coordinateSource} target="_blank" rel="noopener noreferrer" className="underline">Източник на градската координата.</a>}</li>{content.local.universities.length > 0 && <li>Учебни локации: регистърът на НАОА и официалните сайтове, свързани при всяка учебна локация по-горе.</li>}</ul><p>Районите не са изчерпателен официален регистър. Приблизителните съвпадения са отделени. Университетският каталог не съдържа всеки факултет или корпус.</p><Link to="/kontakti" className="inline-flex min-h-11 items-center font-medium text-primary-700 underline underline-offset-2">Предложи корекция или липсваща локация</Link></div></details></section>
    </div>
  </SiteLayout>;
}
