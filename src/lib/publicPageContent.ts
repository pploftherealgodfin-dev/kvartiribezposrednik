// Build-only export: full local data and articles must not enter the initial client bundle.
import { cityContents, getCityContent, getOtherCities } from '@/pages/cities/data';
import { cityJsonLd } from '@/pages/cities/data/structuredData';
import { guides, getGuide } from '@/pages/guides/data';
import { infoPages, faqItems } from '@/pages/info/content';
import { nationalCities } from './locationCatalog';
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from './seo';
import { getPageMeta, SITE_ORIGIN } from './pageCatalog';
import { websiteJsonLd, organizationJsonLd, SOCIAL_PROFILES } from './siteIdentity';

export function getPublicJsonLd(path: string): Record<string, unknown>[] {
  const city = getCityContent(path.startsWith('/kvartiri-bez-posrednik/') ? path.split('/')[2] : undefined);
  if (city) return cityJsonLd(city);
  const guide = path.startsWith('/saveti/') ? getGuide(path.split('/')[2]) : undefined;
  if (guide) return [breadcrumbJsonLd([{ name: 'Начало', path: '/' }, { name: 'Съвети', path: '/saveti' }, { name: guide.title, path }]), articleJsonLd({ title: guide.title, description: guide.excerpt, path, image: guide.heroImage, datePublished: guide.publishedAt, dateModified: guide.updatedAt, keywords: guide.keywords }), ...(guide.faq?.length ? [faqJsonLd(guide.faq)] : [])];
  if (path === '/') return [websiteJsonLd(), organizationJsonLd()];
  if (path === '/za-nas') return [breadcrumbJsonLd([{ name: 'Начало', path: '/' }, { name: 'За нас', path }]), organizationJsonLd()];
  if (path === '/404') return [];
  const title = getPageMeta(path).title.split(' | ')[0];
  return [breadcrumbJsonLd([{ name: 'Начало', path: '/' }, { name: title, path }]), ...(path === '/faq' ? [faqJsonLd(faqItems)] : [{ '@context': 'https://schema.org', '@type': path === '/kvartiri-bez-posrednik' || path === '/saveti' ? 'CollectionPage' : 'WebPage', name: title, url: absoluteUrl(path), inLanguage: 'bg-BG' }])];
}
export function getPublicLastmod(path: string): string | undefined {
  if (path.startsWith('/kvartiri-bez-posrednik/')) return getCityContent(path.split('/')[2])?.updatedAt;
  if (path.startsWith('/saveti/')) return getGuide(path.split('/')[2])?.updatedAt;
  // No fabricated timestamp from the build clock for unchanged pages.
  return undefined;
}
const text = (value: string) => value.replace(/\\/g, '\\\\').replace(/[\[\]<>]/g, char => `\\${char}`);
const link = (label: string, path: string) => `[${text(label)}](${absoluteUrl(path)})`;
const questions = (items: { question: string; answer: string }[]) => items.map(item => `### ${text(item.question)}\n\n${text(item.answer)}`).join('\n\n');
export function getPublicMarkdown(path: string): string | undefined {
  const meta = getPageMeta(path);
  if (!meta.markdownPath) return undefined;
  const city = path.startsWith('/kvartiri-bez-posrednik/') ? getCityContent(path.split('/')[2]) : undefined;
  const guide = path.startsWith('/saveti/') ? getGuide(path.split('/')[2]) : undefined;
  const heading = city ? `Квартири под наем без посредник ${city.inPhrase}${city.label !== city.name ? `, обл. ${city.region}` : ''}` : guide?.title ?? meta.title.split(' | ')[0];
  const introduction = city?.intro ?? guide?.excerpt ?? infoPages[path]?.intro ?? meta.description;
  const parts = [`# ${text(heading)}`, `> ${text(introduction)}`, link('Уеб страница', path)];
  if (city) {
    parts.push(`Местен каталог: ${city.updatedAt}. Област ${city.region}; ЕКАТТЕ ${city.local.ekatte}. Наличните обяви се зареждат при отваряне на уеб страницата; тази версия не е списък на свободни жилища.`, `${link('Търси жилище', `/tarsene?grad=${city.slug}`)} · ${link('Качи обява', '/kachi-obiava')}`, `## Ориентация\n\n${city.about.map(text).join('\n\n')}`);
    if (city.rentalNotes) parts.push(`## ${text(city.rentalNotes.title)}\n\n${city.rentalNotes.points.map(point => `- ${text(point)}`).join('\n')}`);
    if (city.heroImage) parts.push(`Снимка на града: ${city.heroImage}\n\n${text(city.heroImageCredit)}. Не е снимка на предлаган имот.`);
    const { lat, lng } = city.local;
    parts.push(`## Карта\n\n${lat != null && lng != null ? `${link('Градски ориентир в OpenStreetMap', `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`)}. ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E. Това е градска точка, без адреси на жилища.` : `${link('Търси града в OpenStreetMap', `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${city.name}, ${city.region}, България`)}`)}. Няма проверена градска координата.`}`);
    const areas = city.local.areas.filter(item => item.associationMethod !== 'nearest_town_approximate');
    const approximate = city.local.areas.filter(item => item.associationMethod === 'nearest_town_approximate');
    const areaLinks = (items: typeof areas) => items.map(item => `- ${link(item.name, `/tarsene?grad=${city.slug}&kvartal=${item.slug}`)} — ${link('източник: OpenStreetMap', `https://www.openstreetmap.org/${item.sourceRef}`)}`).join('\n');
    parts.push(`## Райони и квартали\n\nИзборът е по желание. Данните от OpenStreetMap са ориентир, не изчерпателен официален списък.\n\n${areas.length ? areaLinks(areas) : 'Няма райони с установена връзка по граница или градски етикет. Търсенето и публикуването работят само с избран град.'}`);
    if (approximate.length) parts.push(`### Приблизително свързани райони\n\nСвързани само по близост до градска точка, без установена граница или градски етикет. Може да са извън града. Уточни адреса преди избор.\n\n${areaLinks(approximate)}`);
    if (city.local.universities.length) parts.push(`## Университети и учебни локации\n\nВръзката се посочва от наемодателите и не удостоверява разстояние до корпус или време за пътуване. Провери адреса на учебната сграда на официалния сайт.\n\n${city.local.universities.map(item => `- ${link(item.name, `/tarsene?grad=${city.slug}&universitet=${item.slug}`)} (${item.kind === 'branch' ? 'филиал / учебна локация' : 'висше училище'}) — ${link('източник', item.sourceUrl)}`).join('\n')}`);
    parts.push(`## Близки градове за сравнение\n\n${lat != null ? 'Приблизителни разстояния по права линия между градски точки; не са маршрути или време за пътуване.' : 'Други градове в същата област, без изчислени разстояния.'}\n\n${getOtherCities(city.slug).map(item => `- ${link(item.label, `/kvartiri-bez-posrednik/${item.slug}`)} — област ${item.region}${item.distanceKm != null ? `, ≈ ${item.distanceKm.toLocaleString('bg-BG')} км по права линия` : ''}`).join('\n')}`, `## Полезни въпроси\n\n${questions(city.faq)}`, `## Преди наемане\n\nУточни правото за отдаване, наема, сметките, депозита, състоянието на имота и срока на договора. ${link('От оглед до договор', '/saveti/ot-ogled-do-dogovor')}. Калкулаторът в уеб страницата използва само въведените от посетителя суми, без пазарни оценки и без изпращане на данни.`, `## Източници и корекции\n\n${link('НСИ — ЕКАТТЕ', 'https://www.nsi.bg/nrnm/ekatte/index')}; ${link('© OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright')}, ${link('ODbL', 'https://opendatacommons.org/licenses/odbl/1-0/')}${city.local.coordinateSource ? `; ${link('източник на градската координата', city.local.coordinateSource)}` : ''}. Учебните локации са свързани с официален източник по-горе. Каталогът е непълен за райони, факултети и корпуси. ${link('Предложи корекция', '/kontakti')}.`);
  } else if (path === '/kvartiri-bez-posrednik') {
    parts.push('Местни справочници за 257 града в 28 области. Градовете с висши училища и филиали са обозначени; наличието на справочник не означава налична обява.');
    for (const region of [...new Set(nationalCities.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'bg'))) parts.push(`## Област ${region}\n\n${cityContents.filter(item => item.region === region).sort((a, b) => a.name.localeCompare(b.name, 'bg')).map(item => `- ${link(item.label, `/kvartiri-bez-posrednik/${item.slug}/index.md`)}${item.local.universities.length ? ' — висше училище или филиал в каталога' : ''}`).join('\n')}`);
    parts.push(`Градове: НСИ / ЕКАТТЕ. Райони: © OpenStreetMap contributors, ODbL. Учебни локации: НАОА и официални сайтове. Покритието на райони и корпуси е непълно. ${link('Предложи корекция', '/kontakti')}.`);
  } else if (guide) {
    parts.push(`Публикувано: ${guide.publishedAt}. Обновено: ${guide.updatedAt}.`, ...(guide.heroImage ? [`Илюстрация: ${guide.heroImage}\n\n${text(guide.heroImageCredit)}`] : []));
    for (const section of guide.sections) parts.push(`## ${text(section.heading)}\n\n${(section.paragraphs ?? []).map(text).join('\n\n')}${section.bullets?.length ? `\n\n${section.bullets.map(item => `- ${text(item)}`).join('\n')}` : ''}${section.note ? `\n\n${text(section.note)}` : ''}`);
    if (guide.faq?.length) parts.push(`## Въпроси и отговори\n\n${questions(guide.faq)}`);
  } else if (path === '/faq') parts.push(questions(faqItems));
  else if (infoPages[path]) for (const section of infoPages[path].sections) parts.push(`## ${text(section.title)}\n\n${section.paragraphs.map(text).join('\n\n')}`);
  else if (path === '/saveti') parts.push(guides.map(item => `- ${link(item.title, `/saveti/${item.slug}/index.md`)}: ${text(item.excerpt)}`).join('\n'));
  else if (path === '/') parts.push(`## Разгледай\n\n- ${link('Търсене на жилище', '/tarsene')}\n- ${link('Градове', '/kvartiri-bez-posrednik/index.md')}\n- ${link('Съвети', '/saveti/index.md')}\n- ${link('Как работи', '/kak-raboti/index.md')}`, 'Обявите и условията се зареждат в уеб страницата. Контакти, лични съобщения, любими и публикуване са достъпни след вход и приложимите потвърждения. Платформата не приема депозити и не участва в плащанията по наема.');
  return `${parts.join('\n\n')}\n`;
}
export function getLlmsIndex(): string {
  return `# Квартири без посредник\n\n> Българска платформа за директен наем между наемодатели и наематели. Публични местни справочници за всички 257 града; контакти и лични съобщения след вход.\n\nЕзик: български. Валута на обявите: EUR. Местен каталог: ${cityContents[0].updatedAt}, 257 града в 28 области, 72 висши училища и учебни локации в 25 града, 1174 районни записа. Районите от OpenStreetMap не са официален изчерпателен регистър; приблизителните връзки са отделени. Каталогът не включва всеки факултет или корпус. Наличните обяви се променят и се зареждат в уеб страниците; справочникът и снимката на град не доказват налично жилище.\n\nРазглеждането е публично. Телефони, лични съобщения, любими, публикуване и данни на акаунти изискват вход и приложимите потвърждения. Markdown версиите съдържат публичното редакционно съдържание, без лични данни или частни действия. Статусът на проверката има конкретен обхват и не гарантира липса на измама. Платформата не приема депозити и не участва в плащанията по наема. llms.txt е указател за съдържанието, не правило за достъп или обещание за класиране.\n\nПилотен режим: една текуща обява на акаунт, която се редактира и подновява. Премахнатите записи се пазят като история. Документната проверка е по желание; публикуването изисква реална снимка, активен акаунт и преглед на съдържанието. Одобрението за публикуване не удостоверява собственост.\n\n## Официални социални профили\n\n${SOCIAL_PROFILES.map(profile => `- ${link(profile.name, profile.url)}`).join('\n')}\n\n## Начало и местни справочници\n\n- ${link('Начало', '/index.md')}: обща информация и навигация.\n- ${link('Всички градове по области', '/kvartiri-bez-posrednik/index.md')}: пълен указател с Markdown връзка за всеки от 257-те града, включително двата града Бяла.\n- ${link('Варна', '/kvartiri-bez-posrednik/varna/index.md')}: местни райони, учебни локации, карта, близки градове и източници.\n- ${link('София', '/kvartiri-bez-posrednik/sofia/index.md')}: местен справочник.\n- ${link('Пловдив', '/kvartiri-bez-posrednik/plovdiv/index.md')}: местен справочник.\n- ${link('Бургас', '/kvartiri-bez-posrednik/burgas/index.md')}: местен справочник.\n- ${link('Търсене на актуални обяви', '/tarsene')}: интерактивни филтри; не е статичен списък на наличността.\n\n## Практични ръководства\n\n${guides.map(item => `- ${link(item.title, `/saveti/${item.slug}/index.md`)}: ${text(item.excerpt)}`).join('\n')}\n\n## Ползване и безопасност\n\n- ${link('Как работи', '/kak-raboti/index.md')}: търсене, оглед, контакт и публикуване.\n- ${link('Въпроси и отговори', '/faq/index.md')}: достъп, профили и проверки.\n- ${link('Разпознай риска преди огледа', '/kak-da-razpoznaem-posrednik/index.md')}: предупредителни признаци и сигнали.\n- ${link('Контакти', '/kontakti')}: обратна връзка и корекции на местния каталог.\n\n## Условия и източници\n\n- ${link('Общи условия', '/obshi-usloviya')}: условия на платформата.\n- ${link('Поверителност', '/politika-za-poveritelnost')}: обработване на лични данни.\n- ${link('Бисквитки', '/biskvitki')}: предпочитания и локално съхранение.\n- ${link('Правила за съдържание', '/pravila-za-sadarzhanie')}: публикуване и сигнали.\n- ${link('Достъпност', '/dostapnost')}: достъпно ползване и обратна връзка.\n- ${link('Публичен местен каталог', '/data/national-catalog.json')}: източници и дата на географските данни; без обяви и данни на потребители. © OpenStreetMap contributors, ODbL.\n- ${link('Sitemap', '/sitemap.xml')}: канонични публични уеб страници.\n`;
}

export function getPublicSourcePaths(path: string): string[] {
  if (path.startsWith('/kvartiri-bez-posrednik/')) return ['public/data/national-catalog.json', 'src/pages/cities/data/index.ts', 'src/pages/cities/data/rentalNotes.ts', 'src/pages/cities/data/photos.ts', 'src/pages/cities/city', 'src/pages/cities/components'];
  if (path.startsWith('/saveti/')) return [`src/pages/guides/data/${path.split('/')[2]}.ts`, 'src/pages/guides/article', 'src/pages/guides/components'];
  if (infoPages[path] || path === '/faq') return ['src/pages/info'];
  const sources: Record<string, string[]> = {
    '/': ['src/pages/home'], '/kvartiri-bez-posrednik': ['src/pages/cities/page.tsx', 'src/pages/cities/components/CityDirectory.tsx', 'src/lib/locationCatalog.ts'],
    '/saveti': ['src/pages/guides/page.tsx', 'src/pages/guides/data'],
    '/kontakti': ['src/pages/contact'], '/obshi-usloviya': ['src/pages/legal/terms'],
    '/politika-za-poveritelnost': ['src/pages/legal/privacy'], '/biskvitki': ['src/pages/legal/cookies'],
    '/pravna-informaciya': ['src/pages/legal/notice'], '/dostapnost': ['src/pages/legal/accessibility'],
    '/pravila-za-sadarzhanie': ['src/pages/legal/content-policy'],
  };
  return sources[path] ?? [];
}
