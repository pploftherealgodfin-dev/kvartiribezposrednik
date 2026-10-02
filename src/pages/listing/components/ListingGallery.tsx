import ListingImage from '@/components/feature/ListingImage';
import { useState } from 'react';
import type { ListingPhoto } from '@/lib/types';

interface ListingGalleryProps {
  photos: ListingPhoto[];
  title: string;
  location: string;
}

export default function ListingGallery({ photos, title, location }: ListingGalleryProps) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center overflow-hidden rounded-lg border border-background-200 bg-background-100 md:h-[420px]">
        <span className="flex flex-col items-center gap-2 text-foreground-500">
          <i className="ri-image-line text-3xl" aria-hidden="true" />
          <span className="text-xs font-medium">—</span>
        </span>
      </div>
    );
  }

  const safeActive = Math.min(active, photos.length - 1);
  const current = photos[safeActive];

  return (
    <div>
      <div className="relative h-72 w-full overflow-hidden rounded-lg border border-background-200 bg-background-100 md:h-[420px]">
        <ListingImage key={current.id}
          photoId={current.id} retryable
          src={current.url}
          width={960} height={640} decoding="async" fetchPriority="high"
          alt={`${title} — ${location}`}
          title={`${title} — ${location}`}
          className="h-full w-full object-cover object-top"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((safeActive - 1 + photos.length) % photos.length)}
              aria-label="Предишна снимка"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background-50/90 text-foreground-800 transition-colors hover:bg-background-50 md:left-4"
            >
              <i className="ri-arrow-left-s-line text-xl" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActive((safeActive + 1) % photos.length)}
              aria-label="Следваща снимка"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background-50/90 text-foreground-800 transition-colors hover:bg-background-50 md:right-4"
            >
              <i className="ri-arrow-right-s-line text-xl" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-foreground-950/70 px-2.5 py-1 text-xs font-medium text-background-50">
              <i className="ri-image-2-line text-sm" aria-hidden="true" />
              {safeActive + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Снимка ${index + 1}`}
                aria-current={index === safeActive}
                className={`h-16 w-20 cursor-pointer overflow-hidden rounded-md border transition-colors ${
                  index === safeActive ? 'border-primary-500' : 'border-background-200 hover:border-primary-300'
                }`}
              >
                <ListingImage
                  photoId={photo.id}
                  src={photo.url}
                  width={120} height={80} loading="lazy" decoding="async"
                  alt={`${title} — снимка ${index + 1}`}
                  className="h-full w-full object-cover object-top"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}