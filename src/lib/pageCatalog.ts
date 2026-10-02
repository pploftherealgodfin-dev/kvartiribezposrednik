import type { PageMeta } from './seo';
import { nationalCities } from './locationCatalog';
import { citySeoSummary } from './citySeoSummary';
import { editorialSeoIndex } from './editorialSeoIndex';
import { cityPhotos } from '@/pages/cities/data/photos';
export const SITE_ORIGIN = 'https://kvartiribezposrednik.com';
const brand = 'Квартири без посредник';
const pages: Record<string, [string, string]> = {
  '/': ['Квартири под наем без посредник — директно от собственик', 'Намери жилище директно от наемодател. Разгледай обяви по град, сравни условията и провери статуса на конкретната обява.'],
  '/kvartiri-bez-posrednik': ['Квартири без посредник по градове', 'Избери град в България и разгледай наличните обяви за директен наем, местна информация и практични съвети.'],
  '/saveti': ['Съвети за наематели и собственици', 'Практични насоки за оглед, разходи, договор и разпознаване на подвеждащи обяви при директен наем.'],
  '/faq': ['Често задавани въпроси', 'Отговори за регистрацията, публикуването, проверките на обяви, комисионите и подаването на сигнали.'],
  '/kontakti': ['Контакти', 'Свържи се с екипа за въпроси, обратна връзка, лични данни или проблем с достъпността.'],
  '/obshi-usloviya': ['Общи условия', 'Условия за ползване на платформата, публикуване на обяви и директен контакт между наематели и наемодатели.'],
  '/politika-za-poveritelnost': ['Политика за поверителност', 'Информация за данните при регистрация, обяви и сигнали и начините за контакт по въпроси за лични данни.'],
  '/biskvitki': ['Бисквитки и локално съхранение', 'Как сайтът запазва сесията и предпочитанията ти в браузъра и как да управляваш тези настройки.'],
  '/pravna-informaciya': ['Правна информация', 'Информация за оператора на платформата и връзка с екипа.'],
  '/dostapnost': ['Достъпност', 'Мерки за достъпно ползване на сайта и начин за съобщаване на затруднения.'],
  '/pravila-za-sadarzhanie': ['Правила за съдържание', 'Изисквания към обявите и начин за подаване на сигнали за измама, посредничество или неточна информация.'],
};
for (const page of editorialSeoIndex) pages[page.path] = [page.title, page.description];
for (const city of nationalCities) {
  const summary = citySeoSummary[city.slug];
  const inPhrase = `${/^[вф]/i.test(city.name) ? 'във' : 'в'} ${city.name}`;
  const ambiguous = nationalCities.filter(item => item.name === city.name).length > 1;
  pages[`/kvartiri-bez-posrednik/${city.slug}`] = [`Квартири под наем без посредник ${inPhrase}${ambiguous ? `, обл. ${city.region}` : ''}`, `Обяви и местен справочник за ${city.name}, област ${city.region}.${summary.areas ? ` ${summary.areas} района в каталога.` : ' Търсене по град.'}${summary.universities ? ` ${summary.universities} учебни локации.` : ` Сравни и ${summary.nearby}.`} Карта, условия за наем и директен контакт след вход.`];
}
export const publicPaths = Object.keys(pages);
export function isPrivateOrUtilityPath(path: string): boolean {
  return /^\/(?:lyubimi|nastroyki|saobshteniya|admin|panel|vhod|moi-profil|kachi-obiava|dokladvane|tarsene|stai-bez-posrednik)(?:\/|$)/.test(path) || /^\/kvartiri-bez-posrednik\/[^/]+\//.test(path);
}
export function getPageMeta(path: string): PageMeta {
  const normalized = path.replace(/\/$/, '') || '/';
  const entry = pages[normalized];
  if (entry) {
    const citySlug = normalized.startsWith('/kvartiri-bez-posrednik/') ? normalized.split('/')[2] : undefined;
    const editorial = editorialSeoIndex.find(page => page.path === normalized);
    const ogImage = cityPhotos[citySlug]?.heroImage ?? editorial?.ogImage ?? (normalized === '/kvartiri-bez-posrednik' ? 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/Varna_Panorama.jpg/1920px-Varna_Panorama.jpg' : undefined);
    const markdownPath = normalized === '/' ? '/index.md' : normalized === '/faq' || normalized === '/saveti' || normalized.startsWith('/kvartiri-bez-posrednik') || editorial ? `${normalized}/index.md` : undefined;
    // Editorial rollout: sparse directories remain useful and public, but stay out of search indexing.
    // This is our content quality gate, not a claimed Google ranking threshold.
    const local = citySlug ? citySeoSummary[citySlug] : undefined;
    const ready = !local || local.areas >= 3 || local.universities > 0;
    return { title: normalized === '/' ? entry[0] : `${entry[0]} | ${brand}`, description: entry[1], canonicalPath: normalized, robots: ready ? 'index, follow' : 'noindex, follow', ogImage, ogType: editorial?.ogType ?? 'website', markdownPath };
  }
  const title = normalized === '/vhod' ? 'Вход и регистрация' : normalized === '/tarsene' ? 'Търсене на жилище' : normalized === '/dokladvane' ? 'Докладвай съдържание' : normalized.startsWith('/obiava/') ? 'Обява под наем' : isPrivateOrUtilityPath(normalized) ? 'Твоят профил' : 'Страницата не е намерена';
  return { title: `${title} | ${brand}`, description: 'Намери жилище или управлявай своите обяви в Квартири без посредник.', canonicalPath: normalized, robots: 'noindex, follow' };
}
