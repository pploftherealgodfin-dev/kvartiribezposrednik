import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingView } from '@/lib/types';
import { formatArea, formatEur, pricePerM2 } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';

const TYPE_KEY: Record<string, string> = {
  apartment: 'type.apartment',
  room: 'type.room',
  studio: 'type.studio',
  house: 'type.house',
};

interface ListingCardProps {
  view: ListingView;
}

export default function ListingCard({ view }: ListingCardProps) {
  const { t } = useTranslation();
  const { listing, city, neighborhood, badges } = view;
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { isFavorite, toggle, busyIds, loading } = useFavorites();
  const [photoIndex, setPhotoIndex] = useState(0);

  const favorite = isFavorite(listing.id);

  const toggleFavorite = () => {
    if (!session) {
      navigate('/vhod', { state: { from: location.pathname + location.search } });
      return;
    }
    toggle(listing.id);
  };

  const photoCount = Math.max(listing.photos.length, 1);
  const safeIndex = photoIndex % photoCount;
  const currentPhoto = listing.photos[safeIndex];
  const locationLabel = `${neighborhood ? `${neighborhood.name}, ` : ''}${city.name}`;
  const perM2 = pricePerM2(listing.priceEur, listing.areaM2);
  const detailPath = `/obiava/${listing.slug}`;

  const goPrev = () => setPhotoIndex((i) => (i - 1 + photoCount) % photoCount);
  const goNext = () => setPhotoIndex((i) => (i + 1) % photoCount);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-lg border border-background-200 bg-background-50 transition-colors hover:border-primary-400 ${
        badges.isRented ? 'opacity-70' : ''
      }`}
    >
      <div className="relative h-52 w-full overflow-hidden bg-background-200">
        <Link to={detailPath} className="block h-full w-full" aria-label={listing.title}>
          {currentPhoto ? (
            <img
              src={currentPhoto.url}
              width={480} height={320} loading="lazy" decoding="async"
              alt={`${listing.title} — ${locationLabel}`}
              title={`${listing.title} — ${locationLabel}`}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-50 text-foreground-500">
                <i className="ri-image-line text-2xl" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-foreground-600">{t('card.noPhotos')}</span>
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          {badges.verifiedOwner && (
            <span className="whitespace-nowrap rounded-md bg-primary-800 px-2.5 py-1 text-[11px] font-semibold text-background-50">
              {t('badges.verifiedOwner')}
            </span>
          )}
          {badges.isNew && !badges.isRented && (
            <span className="whitespace-nowrap rounded-md bg-accent-500 px-2.5 py-1 text-[11px] font-semibold text-foreground-950">
              {t('badges.new')}
            </span>
          )}
          {badges.isRented && (
            <span className="whitespace-nowrap rounded-md bg-background-50 px-2.5 py-1 text-[11px] font-semibold text-foreground-500">
              {t('badges.rented')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleFavorite}
          disabled={loading || busyIds.includes(listing.id)}
          aria-label={t('nav.favorites')}
          aria-pressed={favorite}
          className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background-50/90 text-foreground-700 transition-colors hover:text-primary-600"
        >
          <i className={favorite ? 'ri-heart-fill text-lg text-primary-600' : 'ri-heart-line text-lg'} />
        </button>

        {photoCount > 1 && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Предишна снимка"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-background-50/90 text-foreground-800 hover:bg-background-50"
            >
              <i className="ri-arrow-left-s-line text-lg" />
            </button>
            <span className="flex items-center gap-1 rounded-full bg-foreground-950/70 px-2 py-1 text-[11px] font-medium text-background-50">
              <i className="ri-image-2-line text-xs" />
              {photoCount}
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следваща снимка"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-background-50/90 text-foreground-800 hover:bg-background-50"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight text-foreground-950">
              {formatEur(listing.priceEur)}
            </p>
            <p className="text-xs text-foreground-500">
              {perM2} € {t('card.perM2')}
            </p>
          </div>
          <span className="whitespace-nowrap rounded-md border border-background-300 px-2 py-1 text-[11px] font-medium text-foreground-700">
            {t(TYPE_KEY[listing.type] ?? 'type.all')}
          </span>
        </div>

        <Link
          to={detailPath}
          className="font-heading text-sm font-bold leading-snug text-foreground-900 transition-colors hover:text-primary-700"
        >
          {listing.title}
        </Link>

        <p className="flex items-center gap-1.5 text-xs text-foreground-600">
          <i className="ri-map-pin-2-line text-sm text-foreground-400" />
          {neighborhood ? `${neighborhood.name}, ` : ''}
          {city.name}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-background-200 pt-3 text-xs text-foreground-700">
          <span className="flex items-center gap-1.5">
            <i className="ri-ruler-2-line text-sm text-foreground-400" />
            {formatArea(listing.areaM2)}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="ri-door-closed-line text-sm text-foreground-400" />
            {listing.rooms} {t('card.rooms')}
          </span>
          {listing.floor !== null && (
            <span className="flex items-center gap-1.5">
              <i className="ri-building-2-line text-sm text-foreground-400" />
              {listing.floor} {t('card.floor')}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <i className={listing.furnished ? 'ri-sofa-line text-sm text-foreground-400' : 'ri-home-4-line text-sm text-foreground-400'} />
            {listing.furnished ? t('card.furnished') : t('card.notFurnished')}
          </span>
        </div>
      </div>
    </article>
  );
}