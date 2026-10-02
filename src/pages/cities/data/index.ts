import { nationalCities } from '@/lib/locationCatalog';
import { localCatalog, catalogSnapshot } from './localCatalog';
import { cityPhotos } from './photos';
import { rentalNotes } from './rentalNotes';
import type { CityContent } from './types';
export type { CityContent, CityFaqItem, CityLocalProfile } from './types';

export const cityContents: CityContent[] = nationalCities.map(city => {
  const local = localCatalog[city.slug];
  const areas = local.areas.filter(item => item.associationMethod !== 'nearest_town_approximate');
  const approximate = local.areas.length - areas.length;
  const schools = local.universities;
  const inPhrase = `${/^[вф]/i.test(city.name) ? 'във' : 'в'} ${city.name}`;
  const label = nationalCities.filter(item => item.name === city.name).length > 1 ? `${city.name} (обл. ${city.region})` : city.name;
  const nearby = local.nearby.map(item => nationalCities.find(town => town.slug === item.slug)?.name).filter(Boolean);
  const about = [
    `${city.name} е град в област ${city.region}, с код ЕКАТТЕ ${local.ekatte}. Изборът на град задава границите на търсенето; областта служи за ориентация${label !== city.name ? ' и различава двата града с име Бяла' : ''}.`,
    areas.length ? `В местния каталог са включени ${areas.length} района, сред които ${areas.slice(0, 3).map(item => item.name).join(', ')}. Избери район, когато имаш предпочитано място, или остави филтъра празен за всички обяви в града.` : 'За този град каталогът няма райони с установена връзка по граница или градски етикет в OpenStreetMap. Търсенето и публикуването работят и само с избран град. Уточни местоположението при разговор с наемодателя.',
    schools.length ? `Каталогът включва ${schools.length} висши училища и учебни локации: ${schools.slice(0, 2).map(item => item.name).join('; ')}${schools.length > 2 ? ' и други, изброени по-долу' : ''}. Връзката на жилище с университет се посочва от наемодателя; тя не удостоверява разстояние до конкретен корпус.` : `В проверения каталог не е включено висше училище или филиал за ${label}. Ако учиш в друг град, разгледай и ${nearby.slice(0, 2).join(' или ')} и провери маршрута до действителната учебна сграда.`,
  ];
  const faq = [
    { question: `Как да избера район ${inPhrase}?`, answer: areas.length ? `Започни от районите в каталога, например ${areas.slice(0, 3).map(item => item.name).join(', ')}. Те са ориентир от OpenStreetMap, а не изчерпателен официален списък. Провери адреса, маршрута и средата на място преди решение.${approximate ? ' Допълнителните записи, свързани само по близост, са отделени и обозначени като приблизителни.' : ''}` : `Търси с избран град ${label}, без задължителен квартал. Не добавяме измислени райони, за да запълним каталога. За точното място попитай наемодателя; липсващ район можеш да предложиш през „Контакти“.` },
    schools.length ? { question: 'Как работи изборът на университет?', answer: `Избери една от ${schools.length} учебни локации в този град. Филтърът показва обяви, свързани с нея от наемодателите. Провери на сайта на учебното заведение къде са занятията; каталогът не е списък на всички факултети и корпуси и не измерва време за пътуване.` } : { question: 'Какви други градове мога да сравня?', answer: `Можеш да разгледаш ${nearby.slice(0, 3).join(', ')}. ${local.lat != null ? 'Показаните разстояния са приблизителни по права линия между градски точки от OpenStreetMap, без данни за транспорт или време за пътуване.' : 'Това са други градове в същата област; липсва проверена координата за изчисляване на разстояние.'} Обявите за всеки град са отделни.` },
    { question: 'Какво виждам преди и след вход?', answer: 'Без вход можеш да разглеждаш обяви, условия и местна информация. За телефон, лични съобщения, любими и публикуване е нужен акаунт и изпълнение на изискванията за потвърждение. Проверката на обява има конкретен обхват и не заменя огледа и ясния договор.' },
  ];
  return { ...city, ...cityPhotos[city.slug], label, inPhrase, local, updatedAt: catalogSnapshot, editorial: Boolean(cityPhotos[city.slug]),
    intro: `Избери район${schools.length ? ' или учебна локация' : ''}, сравни условията и се свържи с наемодател след вход. Местният справочник за област ${city.region} остава достъпен и когато няма публикувани обяви.`,
    rentalNotes: rentalNotes[city.slug], about, faq, highlights: [], universities: schools.map(item => item.name), areas: areas.map(item => item.name), keywords: [] };
}).sort((a, b) => Number(b.isUniversityCity) - Number(a.isUniversityCity) || a.name.localeCompare(b.name, 'bg') || a.region.localeCompare(b.region, 'bg'));

const bySlug = new Map(cityContents.map(city => [city.slug, city]));
export function getCityContent(slug?: string): CityContent | undefined { return slug ? bySlug.get(slug) : undefined; }
export function getOtherCities(slug: string): (CityContent & { distanceKm?: number })[] {
  return (bySlug.get(slug)?.local?.nearby ?? []).map(item => ({ ...bySlug.get(item.slug)!, distanceKm: item.km }));
}
