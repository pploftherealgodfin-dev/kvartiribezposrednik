import type { ListingView } from './types';
import { getPageMeta, isPrivateOrUtilityPath, publicPaths, SITE_ORIGIN } from './pageCatalog';

export interface PageMeta {
  title: string;
  description?: string;
  /** Път без домейн, напр. "/kvartiri-bez-posrednik/sofia". */
  canonicalPath?: string;
  ogImage?: string;
  /** OpenGraph тип — "website" по подразбиране, "article" за статии. */
  ogType?: string;
  /** "noindex, follow" за страници с малко съдържание или временни екрани. */
  robots?: string;
}

/** Няма демонстрационна снимка по подразбиране. */
export const DEFAULT_OG_IMAGE = undefined;

export const SITE_LOCALE = 'bg_BG';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const origin = SITE_ORIGIN;
  return `${origin}${path}`;
}

/**
 * Задава title, description, canonical, OpenGraph, Twitter и robots за текущата страница.
 * Всички клиентски страници трябва да го викат, за да имат уникален SEO профил.
 */
export function applyPageMeta(meta: PageMeta): void {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (publicPaths.includes(path)) meta = { ...meta, ...getPageMeta(path) };
  if (isPrivateOrUtilityPath(path)) meta = { ...meta, robots: 'noindex, follow' };
  meta = { ...meta, description: meta.description ?? '', canonicalPath: meta.canonicalPath ?? path };
  document.title = meta.title;

  const image = meta.ogImage ?? DEFAULT_OG_IMAGE;

  // OpenGraph
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:site_name', 'Квартири под наем без посредник');
  upsertMeta('property', 'og:locale', SITE_LOCALE);
  upsertMeta('property', 'og:type', meta.ogType ?? 'website');
  if (image) upsertMeta('property', 'og:image', image);
  else document.head.querySelector('meta[property="og:image"]')?.remove();

  // Twitter
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:title', meta.title);
  if (image) upsertMeta('name', 'twitter:image', image);
  else document.head.querySelector('meta[name="twitter:image"]')?.remove();

  if (meta.description !== undefined) {
    upsertMeta('name', 'description', meta.description);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('name', 'twitter:description', meta.description);
  }
  if (meta.canonicalPath) {
    const url = absoluteUrl(meta.canonicalPath);
    upsertCanonical(url);
    upsertMeta('property', 'og:url', url);
  }
  upsertMeta('name', 'robots', meta.robots ?? 'index, follow');
}

export function setJsonLd(id: string, data: unknown): void {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function removeJsonLd(id: string): void {
  const el = document.getElementById(id);
  if (el) el.remove();
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function realEstateListingJsonLd(view: ListingView): Record<string, unknown> {
  const { listing, city, neighborhood, owner } = view;
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    datePosted: listing.createdAt,
    url: absoluteUrl(`/obiava/${listing.slug}`),
    numberOfRooms: listing.rooms,
    floorSize: { '@type': 'QuantitativeValue', value: listing.areaM2, unitCode: 'MTK' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: neighborhood?.name ?? undefined,
      addressCountry: 'BG',
    },
    offers: {
      '@type': 'Offer',
      price: listing.priceEur,
      priceCurrency: 'EUR',
      availability:
        listing.status === 'rented' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      seller: { '@type': 'Person', name: owner.name },
    },
  };
}

export function faqJsonLd(
  items: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Article JSON-LD за редакционните статии в „Съвети". */
export function articleJsonLd(article: {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  keywords: string[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    ...(article.image ? { image: [absoluteUrl(article.image)] } : {}),
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: 'bg-BG',
    keywords: article.keywords.join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(article.path) },
    author: { '@type': 'Organization', name: 'Квартири под наем без посредник' },
    publisher: {
      '@type': 'Organization',
      name: 'Квартири под наем без посредник',
    },
  };
}