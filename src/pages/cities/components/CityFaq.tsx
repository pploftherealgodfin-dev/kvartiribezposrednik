import type { CityFaqItem } from '@/pages/cities/data';
export default function CityFaq({ items, title }: { items: CityFaqItem[]; title: string }) {
  return <div><h2 className="font-heading text-2xl font-semibold text-foreground-950">{title}</h2><div className="mt-5 divide-y divide-background-200 rounded-xl border border-background-200 bg-background-50">{items.map(item => <details key={item.question} className="group px-5"><summary className="py-4 font-medium text-foreground-900">{item.question}</summary><p className="pb-5 text-sm leading-relaxed text-foreground-700">{item.answer}</p></details>)}</div></div>;
}
