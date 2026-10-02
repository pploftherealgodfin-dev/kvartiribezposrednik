import type { Guide } from '@/pages/guides/data/types';

interface GuideBodyProps {
  guide: Guide;
}

export default function GuideBody({ guide }: GuideBodyProps) {
  return (
    <div className="space-y-9">
      {guide.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="font-heading text-xl font-bold leading-snug text-foreground-950 md:text-2xl">
            {section.heading}
          </h2>

          {section.paragraphs && (
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-sm leading-relaxed text-foreground-700 md:text-[15px]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {section.bullets && (
            <ul className="mt-3 space-y-2.5">
              {section.bullets.map((bullet, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground-700 md:text-[15px]"
                >
                  <i
                    className="ri-check-line mt-0.5 text-base text-primary-600"
                    aria-hidden="true"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {section.note && (
            <p className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm leading-relaxed text-foreground-800">
              <i className="ri-lightbulb-line mt-0.5 text-base text-accent-700" aria-hidden="true" />
              <span>{section.note}</span>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}