export interface CityFaqItem {
  question: string;
  answer: string;
}

export interface CityLocalProfile {
  ekatte: string;
  lat: number | null;
  lng: number | null;
  coordinateSource?: string;
  areas: { slug: string; name: string; sourceRef: string; associationMethod: string }[];
  universities: { slug: string; name: string; sourceUrl: string; kind: 'institution' | 'branch' }[];
  nearby: { slug: string; km?: number }[];
}

/** Local information with traceable sources, shared by the page and its Markdown version. */
export interface CityContent {
  isUniversityCity?: boolean;
  editorial?: boolean;
  slug: string;
  /** Име за заглавия, напр. „София“. */
  name: string;
  /** Форма с предлог, напр. „във Варна“ — използва се в изречения. */
  inPhrase: string;
  /** Област, напр. „Софийска област“. */
  region: string;
  heroImage?: string;
  heroImageCredit?: string;
  intro: string;
  about: string[];
  highlights: string[];
  universities: string[];
  areas: string[];
  faq: CityFaqItem[];
  keywords: string[];
  label?: string;
  local?: CityLocalProfile;
  updatedAt?: string;
  rentalNotes?: { title: string; points: string[] };
}
