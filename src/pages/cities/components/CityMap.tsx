import { useState } from 'react';
import type { CityContent } from '@/pages/cities/data';

export default function CityMap({ city }: { city: CityContent }) {
  const [open, setOpen] = useState(false);
  const { lat, lng } = city.local;
  const positioned = lat != null && lng != null;
  const href = positioned ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${city.name}, ${city.region}, България`)}`;
  const bbox = positioned ? [lng - 0.055, lat - 0.035, lng + 0.055, lat + 0.035].join(',') : '';
  return <div className="overflow-hidden rounded-2xl border border-background-200 bg-background-50">
    {open && positioned ? <iframe title={`Карта на ${city.label}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`} className="aspect-[4/3] w-full border-0" loading="lazy" referrerPolicy="no-referrer" /> : <div className="flex aspect-[4/3] flex-col items-center justify-center px-6 py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><i className="ri-map-pin-2-line text-3xl" aria-hidden="true" /></span>
      <p className="mt-4 font-heading text-xl font-semibold">{city.label}</p><p className="mt-1 text-sm text-foreground-600">Област {city.region}</p>
      {positioned ? <><p className="ui-note mt-3">Градска точка: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E</p><button type="button" onClick={() => setOpen(true)} className="ui-secondary mt-5">Покажи карта</button><p className="ui-note mt-2 max-w-xs">При отваряне картата се зарежда от OpenStreetMap.</p></> : <p className="ui-note mt-4 max-w-xs">Няма проверена градска координата. Отвори търсенето в картата и уточни местоположението.</p>}
    </div>}
    <div className="border-t border-background-200 px-4 py-3"><a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-700">Отвори в OpenStreetMap<i className="ri-external-link-line" aria-hidden="true" /><span className="sr-only"> (нов раздел)</span></a><p className="ui-note">© OpenStreetMap contributors · Градски ориентир, без адреси на жилища.</p></div>
  </div>;
}
