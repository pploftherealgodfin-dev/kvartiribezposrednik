import type { CityContent } from '@/pages/cities/data';

interface CityFactsProps {
  city: CityContent;
}

export default function CityFacts({ city }: CityFactsProps) {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground-950 md:text-3xl">
          Какво да знаеш за наемите {city.inPhrase}
        </h2>
        <div className="mt-5 space-y-4">
          {city.about.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-foreground-700 md:text-[15px]">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <aside className="rounded-lg border border-background-200 bg-background-100 p-5 md:p-6">
        <h3 className="font-heading text-base font-bold text-foreground-950">
          Защо си струва {city.inPhrase}
        </h3>
        <ul className="mt-4 space-y-3">
          {city.highlights.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-foreground-700">
              <i className="ri-checkbox-circle-line mt-0.5 text-base text-primary-600" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}