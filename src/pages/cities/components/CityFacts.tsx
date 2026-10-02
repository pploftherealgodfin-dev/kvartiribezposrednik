import { Link } from 'react-router-dom';
import type { CityContent } from '@/pages/cities/data';
import CityMap from './CityMap';

export default function CityFacts({ city }: { city: CityContent }) {
  return <section className={`grid gap-8 ${city.heroImage ? 'lg:grid-cols-[1.3fr_1fr]' : ''}`}>
    <div><h2 className="font-heading text-2xl font-semibold text-foreground-950">Ориентация в {city.label}</h2><div className="mt-4 space-y-4">{city.about.map(paragraph => <p key={paragraph} className="text-sm leading-relaxed text-foreground-700 md:text-base">{paragraph}</p>)}</div>
      <div className="ui-note mt-5 border-l-2 border-primary-300 pl-4">Информация от ЕКАТТЕ, НАОА, официални сайтове на учебните заведения и OpenStreetMap. Каталогът е от {city.updatedAt}; покритието на райони и корпуси е непълно. <Link to="#iztochnici" className="font-medium text-primary-700 underline underline-offset-2">Източници и корекции</Link></div>
      {city.rentalNotes && <aside className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5"><h3 className="font-heading text-base font-semibold">{city.rentalNotes.title}</h3><ul className="mt-3 space-y-3 text-sm leading-relaxed text-foreground-700">{city.rentalNotes.points.map(point => <li key={point} className="flex gap-2"><i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-primary-700" aria-hidden="true" /><span>{point}</span></li>)}</ul></aside>}
    </div>{city.heroImage && <CityMap city={city} />}
  </section>;
}
