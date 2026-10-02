import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CityContent, CityLocalProfile } from '@/pages/cities/data';

function Areas({ items, citySlug, approximate = false }: { items: CityLocalProfile['areas']; citySlug: string; approximate?: boolean }) {
  const cards = (records: typeof items) => <ul className="grid gap-2 sm:grid-cols-2">{records.map(item => <li key={item.slug} className="min-w-0 rounded-lg border border-background-200 bg-background-50 px-3 py-1">
    <Link to={`/tarsene?grad=${citySlug}&kvartal=${item.slug}`} data-association={item.associationMethod} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm font-medium text-foreground-800 hover:text-primary-700"><span className="min-w-0 break-words">{item.name}{approximate && <span className="mt-1 block text-xs font-normal text-foreground-600">Приблизителна връзка с града</span>}</span><i className="ri-arrow-right-line shrink-0 text-foreground-500" aria-hidden="true" /></Link>
    <a href={`https://www.openstreetmap.org/${item.sourceRef}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs text-foreground-600 underline underline-offset-2">Източник: OpenStreetMap<span className="sr-only"> (нов раздел)</span></a>
  </li>)}</ul>;
  return <>{cards(items.slice(0, 8))}{items.length > 8 && <details className="mt-3"><summary className="py-3 text-sm font-medium text-primary-700">Още {items.length - 8} района</summary><div className="mt-2">{cards(items.slice(8))}</div></details>}</>;
}

export function CityAreas({ city }: { city: CityContent }) {
  const [query, setQuery] = useState('');
  const matching = city.local.areas.filter(item => item.name.toLocaleLowerCase('bg').includes(query.trim().toLocaleLowerCase('bg')));
  const areas = matching.filter(item => item.associationMethod !== 'nearest_town_approximate');
  const approximate = matching.filter(item => item.associationMethod === 'nearest_town_approximate');
  return <section id="raioni" tabIndex={-1} className="min-w-0 outline-none">
    <h2 className="font-heading text-2xl font-semibold">Райони и квартали</h2><p className="mt-3 text-sm leading-relaxed text-foreground-600">Изборът е по желание. Данните от OpenStreetMap са ориентир и може да са непълни; провери действителното местоположение при оглед.</p>
    {city.local.areas.length > 8 && <label className="ui-label mt-5" htmlFor="area-search">Намери район<input id="area-search" type="search" className="ui-field mt-2" value={query} onChange={event => setQuery(event.target.value)} placeholder="Име или част от името" /></label>}
    <div className="mt-5">{areas.length ? <Areas items={areas} citySlug={city.slug} /> : <p className="rounded-lg border border-background-200 bg-background-100 p-4 text-sm leading-relaxed text-foreground-700">{query ? 'Няма съвпадение сред районите с връзка по граница или градски етикет.' : 'В каталога няма райони с връзка по граница или градски етикет за този град.'} Можеш да търсиш и публикуваш само с избран град.</p>}</div>
    {approximate.length > 0 && <details className="mt-4 rounded-xl border border-accent-200 bg-accent-50 p-4"><summary className="font-medium text-foreground-900">Приблизително свързани райони · {approximate.length}</summary><p className="my-3 text-sm leading-relaxed text-foreground-700">Тези записи са свързани по близост до градска точка, без установена граница или градски етикет. Може да са извън града. Не ги представяме като официални квартали; уточни адреса преди избор.</p><Areas items={approximate} citySlug={city.slug} approximate /></details>}
    <Link to={`/tarsene?grad=${city.slug}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-700">Всички обяви в града<i className="ri-arrow-right-line" aria-hidden="true" /></Link>
  </section>;
}

export function CityUniversities({ city }: { city: CityContent }) {
  const items = city.local.universities;
  const cards = (records: typeof items) => <ul className="space-y-3">{records.map(item => <li key={item.slug} className="min-w-0 rounded-xl border border-background-200 bg-background-50 p-4">
    <p className="mb-1 text-xs text-foreground-600">{item.kind === 'branch' ? 'Филиал / учебна локация' : 'Висше училище'}</p><h3 className="break-words text-sm font-semibold leading-relaxed">{item.name}</h3>
    <div className="mt-2 flex flex-wrap gap-x-5"><Link to={`/tarsene?grad=${city.slug}&universitet=${item.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary-700">Свързани обяви<i className="ri-arrow-right-line" aria-hidden="true" /></Link><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs text-foreground-600 underline underline-offset-2">{item.kind === 'branch' ? 'Официален сайт' : 'Регистър на НАОА'}<span className="sr-only"> (нов раздел)</span></a></div>
  </li>)}</ul>;
  return <section id="universiteti" tabIndex={-1} className="min-w-0 outline-none"><h2 className="font-heading text-2xl font-semibold">Университети и учебни локации</h2><p className="mt-3 text-sm leading-relaxed text-foreground-600">Провери адреса на факултета или корпуса на официалния сайт. Филтърът използва връзката, посочена от наемодателя; не удостоверява разстояние или време за пътуване.</p><div className="mt-5">{cards(items.slice(0, 4))}</div>{items.length > 4 && <details className="mt-3"><summary className="py-3 text-sm font-medium text-primary-700">Още {items.length - 4} учебни локации</summary><div className="mt-2">{cards(items.slice(4))}</div></details>}</section>;
}
