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
export const cityContents: CityContent[] = [
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

export function getCityContent(slug?: string): CityContent | undefined {
  if (!slug) return undefined;
  return cityContents.find((city) => city.slug === slug);
}

export function getOtherCities(slug: string): CityContent[] {
  return cityContents.filter((city) => city.slug !== slug);
}