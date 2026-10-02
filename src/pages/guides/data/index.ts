import type { Guide } from './types';
import { kakDaRazpoznamBroker } from './kak-da-razpoznam-broker';
import { otOgledDoDogovor } from './ot-ogled-do-dogovor';
import { skritiTaksiIKomisioni } from './skriti-taksi-i-komisioni';
import { naemodatelBezAgencia } from './naemodatel-bez-agencia';
import { kvartiraZaStudenti } from './kvartira-za-studenti';

export type { Guide, GuideBlock, GuideFaqItem } from './types';

export const guides: Guide[] = [
  kakDaRazpoznamBroker,
  otOgledDoDogovor,
  skritiTaksiIKomisioni,
  naemodatelBezAgencia,
  kvartiraZaStudenti,
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}

export function getRelatedGuides(slug: string, limit = 3): Guide[] {
  return guides.filter((guide) => guide.slug !== slug).slice(0, limit);
}