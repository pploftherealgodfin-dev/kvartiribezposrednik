export interface GuideBlock {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
}

export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  heroImage?: string;
  keywords: string[];
  sections: GuideBlock[];
  faq?: GuideFaqItem[];
}