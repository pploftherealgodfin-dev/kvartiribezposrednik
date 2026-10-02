import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CityContent } from '@/pages/cities/data';
interface CityDirectoryProps { cities: CityContent[]; title: string; subtitle?: string }
export default function CityDirectory({ cities, title, subtitle }: CityDirectoryProps) {
  const [query, setQuery] = useState('');
  const items = cities.filter(city => `${city.name} ${city.region}`.toLocaleLowerCase('bg').includes(query.trim().toLocaleLowerCase('bg')));
  return <div><h2 className="font-heading text-2xl font-bold text-foreground-950 md:text-3xl">{title}</h2>{subtitle && <p className="mt-2 max-w-2xl text-sm text-foreground-600">{subtitle}</p>}
    {cities.length > 12 && <label className="mt-5 block max-w-xl text-sm font-semibold">Намери град или област<input type="search" value={query} onChange={e => setQuery(e.target.value)} className="mt-2 block w-full rounded-md border border-background-300 bg-background-50 p-3" placeholder="Например София, Враца, Добрич…" /></label>}
    <p role="status" className="mt-4 text-sm text-foreground-600">{items.length} града{cities.length > 12 ? ' · Градовете с университети и филиали са първи.' : ''}</p>
    {!items.length && <p className="mt-5">Не е намерен град. Опитай с друга част от името или областта.</p>}
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(city => <Link key={city.slug} to={`/kvartiri-bez-posrednik/${city.slug}`} className="group flex items-center gap-4 overflow-hidden rounded-lg border border-background-200 bg-background-50 p-4 transition-colors hover:border-primary-300"><div className="min-w-0"><p className="font-heading text-sm font-bold text-foreground-950 group-hover:text-primary-700">{city.name}</p><p className="mt-1 text-xs text-foreground-600">Област {city.region}</p>{city.isUniversityCity && <span className="mt-2 inline-block rounded bg-primary-50 px-2 py-1 text-xs text-primary-800">Университет / филиал</span>}</div><i className="ml-auto ri-arrow-right-line text-lg text-foreground-500" aria-hidden="true" /></Link>)}</div>
  </div>;
}
