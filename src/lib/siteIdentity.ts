/** Public brand identity only; no invented operator address, phone or legal entity. */
export const SITE_NAME = 'Квартири без посредник';
export const SITE_URL = 'https://kvartiribezposrednik.com';
export const SITE_SOCIAL_IMAGE = 'https://storage.helloreaddy.io/project_files/ec55975f-5ed3-4d5b-8aa1-af26ca453ac6/7d9d0eb4-5a72-4191-8b88-a1adb8ecc3a0_compressed_logo-og-image-favicon-.webp?ogv=1bto0hx';
export const SOCIAL_PROFILES = [
  { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61595029650181', icon: 'ri-facebook-circle-line' },
  { name: 'Instagram', url: 'https://www.instagram.com/kvartiribezposrednik/', icon: 'ri-instagram-line' },
] as const;
export function websiteJsonLd() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, alternateName: 'kvartiribezposrednik.com', url: `${SITE_URL}/`, inLanguage: 'bg-BG', publisher: { '@id': `${SITE_URL}/#organization` } };
}
export function organizationJsonLd() {
  return { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: `${SITE_URL}/`, logo: SITE_SOCIAL_IMAGE, sameAs: SOCIAL_PROFILES.map(profile => profile.url), areaServed: { '@type': 'Country', name: 'България' } };
}
