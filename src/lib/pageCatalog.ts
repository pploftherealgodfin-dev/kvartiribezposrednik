import type { PageMeta } from './seo';
import { cityContents } from '@/pages/cities/data';
import { guides } from '@/pages/guides/data';
import { infoPages } from '@/pages/info/content';
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
for (const [path, page] of Object.entries(infoPages)) pages[path] = [page.title, page.intro];
for (const city of cityContents) pages[`/kvartiri-bez-posrednik/${city.slug}`] = [`Квартири под наем без посредник ${city.inPhrase}`, `Разгледай наличните жилища под наем ${city.inPhrase}, информация за районите и практични съвети за директен контакт с наемодател.`];
for (const guide of guides) pages[`/saveti/${guide.slug}`] = [guide.title, guide.excerpt];
export const publicPaths = Object.keys(pages);
export function isPrivateOrUtilityPath(path: string): boolean {
  return /^\/(?:lyubimi|nastroyki|saobshteniya|admin|panel|vhod|moi-profil|kachi-obiava|dokladvane|tarsene|stai-bez-posrednik)(?:\/|$)/.test(path) || /^\/kvartiri-bez-posrednik\/[^/]+\//.test(path);
}
export function getPageMeta(path: string): PageMeta {
  const normalized = path.replace(/\/$/, '') || '/';
  const entry = pages[normalized];
  if (entry) return { title: normalized === '/' ? entry[0] : `${entry[0]} | ${brand}`, description: entry[1], canonicalPath: normalized, robots: cityContents.some(city => `/kvartiri-bez-posrednik/${city.slug}` === normalized && !city.editorial) ? 'noindex, follow' : 'index, follow' };
  const title = normalized === '/vhod' ? 'Вход и регистрация' : normalized === '/tarsene' ? 'Търсене на жилище' : normalized === '/dokladvane' ? 'Докладвай съдържание' : normalized.startsWith('/obiava/') ? 'Обява под наем' : isPrivateOrUtilityPath(normalized) ? 'Твоят профил' : 'Страницата не е намерена';
  return { title: `${title} | ${brand}`, description: 'Намери жилище или управлявай своите обяви в Квартири без посредник.', canonicalPath: normalized, robots: normalized.startsWith('/obiava/') ? 'index, follow' : 'noindex, follow' };
}
