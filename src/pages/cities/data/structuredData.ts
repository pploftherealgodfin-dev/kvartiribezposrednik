import { absoluteUrl, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';
import type { CityContent } from './types';
export function cityJsonLd(city: CityContent): Record<string, unknown>[] {
  const path = `/kvartiri-bez-posrednik/${city.slug}`;
  const url = absoluteUrl(path);
  return [breadcrumbJsonLd([{ name: 'Начало', path: '/' }, { name: 'Градове', path: '/kvartiri-bez-posrednik' }, { name: city.label, path }]), {
    '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': url, url,
    name: `Квартири под наем без посредник ${city.inPhrase}${city.label !== city.name ? `, обл. ${city.region}` : ''}`,
    description: city.intro, inLanguage: 'bg-BG',
    about: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'AdministrativeArea', name: city.region }, ...(city.local.lat != null && city.local.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: city.local.lat, longitude: city.local.lng } } : {}) },
    ...(city.heroImage ? { image: city.heroImage } : {}),
    // The snapshot date describes local guide content, never live inventory.
    dateModified: city.updatedAt,
  }, faqJsonLd(city.faq)];
}
