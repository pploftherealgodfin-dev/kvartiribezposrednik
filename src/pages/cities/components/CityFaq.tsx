import { useState } from 'react';
import type { CityFaqItem } from '@/pages/cities/data';

interface CityFaqProps {
  items: CityFaqItem[];
  title: string;
}

export default function CityFaq({ items, title }: CityFaqProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground-950 md:text-3xl">{title}</h2>
      <div className="mt-6 space-y-3">
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <div
              key={item.question}
              className="overflow-hidden rounded-lg border border-background-200 bg-background-50"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left md:px-5"
              >
                <span className="font-heading text-sm font-bold text-foreground-950 md:text-base">
                  {item.question}
                </span>
                <i
                  className={`text-lg text-foreground-500 transition-transform ${
                    isOpen ? 'ri-subtract-line' : 'ri-add-line'
                  }`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm leading-relaxed text-foreground-700 md:px-5">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}