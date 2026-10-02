export interface CityFaqItem {
  question: string;
  answer: string;
}

/**
 * Редакционно съдържание за градска landing страница.
 * Служи за национално SEO покритие по ключовата дума „без посредник“ + град.
 */
export interface CityContent {
  slug: string;
  /** Име за заглавия, напр. „София“. */
  name: string;
  /** Форма с предлог, напр. „във Варна“ — използва се в изречения. */
  inPhrase: string;
  /** Област, напр. „Софийска област“. */
  region: string;
  heroImage: string;
  intro: string;
  about: string[];
  highlights: string[];
  universities: string[];
  areas: string[];
  faq: CityFaqItem[];
  keywords: string[];
}