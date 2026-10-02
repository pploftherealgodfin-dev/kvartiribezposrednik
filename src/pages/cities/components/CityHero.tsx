import { Link } from 'react-router-dom';
import type { CityContent } from '@/pages/cities/data';
import CityMap from './CityMap';

export default function CityHero({ city, listingCount }: { city: CityContent; listingCount: number | null }) {
  return <section className="border-b border-background-200 bg-background-100">
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <nav aria-label="Път до страницата" className="flex flex-wrap items-center gap-2 text-xs text-foreground-600">
        <Link to="/" className="hover:text-primary-700">Начало</Link><span aria-hidden="true">/</span>
        <Link to="/kvartiri-bez-posrednik" className="hover:text-primary-700">Градове</Link><span aria-hidden="true">/</span><span aria-current="page">{city.label}</span>
      </nav>
      <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">Местен справочник · област {city.region}</p>
          <h1 className="mt-4 text-balance font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground-950 md:text-[42px]">Квартири под наем без посредник {city.inPhrase}{city.label !== city.name && <span className="mt-2 block text-lg text-foreground-600">Област {city.region}</span>}</h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-foreground-600 md:text-base">{city.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link to={`/tarsene?grad=${city.slug}`} className="ui-button"><i className="ri-search-line" aria-hidden="true" />Търси жилище</Link><Link to="/kachi-obiava" className="ui-secondary">Качи обява</Link></div>
          <p className="ui-note mt-4">Разглеждаш без вход. Контактите и съобщенията са достъпни след вход.</p>
          <p className="mt-5 flex items-center gap-2 text-sm text-foreground-700"><i className="ri-home-4-line text-primary-600" aria-hidden="true" />{listingCount === null ? 'Наличността се проверява при отваряне на страницата.' : `${listingCount} публикувани ${listingCount === 1 ? 'обява' : 'обяви'} в града`}</p>
        </div>
        {city.heroImage ? <figure className="min-w-0"><img src={city.heroImage} alt={`Градски изглед: ${city.name}`} width="960" height="720" className="aspect-[4/3] w-full rounded-2xl object-cover" fetchPriority="high" decoding="async" /><figcaption className="mt-2 text-[10px] leading-relaxed text-foreground-600">{city.heroImageCredit} · Снимката е на града, не на предлаган имот.</figcaption></figure> : <CityMap city={city} />}
      </div>
      <nav aria-label="Раздели на местния справочник" className="mt-8 flex flex-wrap gap-x-5 gap-y-1 border-t border-background-200 pt-4 text-sm font-medium text-foreground-700">
        {[['obavi','Обяви'],['raioni','Райони'],...(city.local.universities.length ? [['universiteti','Университети']] : []),['praktichno','Преди наемане'],['blizki-gradove','Близки градове'],['vuprosi','Въпроси']].map(([id,label]) => <Link key={id} to={`#${id}`} className="inline-flex min-h-11 items-center hover:text-primary-700">{label}</Link>)}
      </nav>
    </div>
  </section>;
}
