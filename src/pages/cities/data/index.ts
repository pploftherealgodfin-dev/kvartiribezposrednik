import { nationalCities } from '@/lib/locationCatalog';
import type { CityContent } from './types';
import { sofia } from './sofia';
import { plovdiv } from './plovdiv';
import { varna } from './varna';
import { burgas } from './burgas';
import { ruse } from './ruse';
import { staraZagora } from './stara-zagora';
import { velikoTarnovo } from './veliko-tarnovo';
import { blagoevgrad } from './blagoevgrad';
import { pleven } from './pleven';
import { gabrovo } from './gabrovo';
import { shumen } from './shumen';
import { svishov } from './svishov';

export type { CityContent, CityFaqItem } from './types';

/** Ключовите университетски градове, покрити с градска landing страница. */
const editorialCities: CityContent[] = [
  sofia,
  plovdiv,
  varna,
  burgas,
  ruse,
  staraZagora,
  velikoTarnovo,
  blagoevgrad,
  pleven,
  gabrovo,
  shumen,
  svishov,
];

export const cityContents: CityContent[] = nationalCities.map(city => {
  const edited = editorialCities.find(item => item.slug === city.slug);
  if (edited) return { ...edited, region: city.region, isUniversityCity: city.isUniversityCity, editorial: true };
  const inPhrase = `${/^[вф]/i.test(city.name) ? 'във' : 'в'} ${city.name}`;
  return {
    slug: city.slug, name: city.name, region: city.region, inPhrase, isUniversityCity: city.isUniversityCity, editorial: false,
    intro: `Търси жилище ${inPhrase} директно от наемодател. Сравни наема, площта и условията; регистрация е нужна за личен контакт и запазване на любими.`,
    about: [`${city.name} е град в област ${city.region} според официалния каталог ЕКАТТЕ.`, 'Избери квартал, ако е включен в каталога, или разгледай всички обяви в града. Ако липсва район, можеш да публикуваш с избран град и да изпратиш предложение за допълване.', 'Провери реалния имот и правото да бъде отдаван преди плащане. Не изпращай депозит само по снимки или обещание за ключ.'],
    highlights: ['Обяви без брокерска комисиона', 'Общ каталог за търсене и публикуване', 'Лични контакти и съобщения след вход'],
    universities: [], areas: [], faq: [{ question: `Как да търся жилище ${inPhrase}?`, answer: 'Отвори търсенето за града и избери бюджет, площ, тип имот и условия. Наличните квартали и университети се ограничават до същия град.' }, { question: 'Мога ли да разглеждам без регистрация?', answer: 'Да. Вход в потвърден акаунт е нужен за показване на контакти, лични съобщения, любими и публикуване.' }], keywords: [],
  };
}).sort((a,b) => Number(b.isUniversityCity) - Number(a.isUniversityCity) || a.name.localeCompare(b.name,'bg') || a.region.localeCompare(b.region,'bg'));

export function getCityContent(slug?: string): CityContent | undefined {
  if (!slug) return undefined;
  return cityContents.find((city) => city.slug === slug);
}

export function getOtherCities(slug: string): CityContent[] {
  return cityContents.filter((city) => city.slug !== slug && city.editorial).slice(0, 12);
}