import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addListingPhotos,
  deleteListingPhoto,
  getListingPhotos,
  reorderListingPhotos,
  type ListingPhotoRow,
} from '@/lib/repository/owner';
import {
  PHOTO_LIMITS,
  uploadListingPhotos,
  validatePhotoFile,
  type PhotoValidationError,
} from '@/lib/storage';
import PhotoSortGrid, { type PhotoSortItem } from './PhotoSortGrid';

interface ListingPhotosManagerProps {
  listingId: string;
  ownerId: string;
  /** Извиква се след промяна, за да се обнови списъкът с обяви. */
  onChanged?: () => void;
}

const ERROR_KEY: Record<PhotoValidationError, string> = {
  unsupportedType: 'owner.form.photoBadType',
  tooLarge: 'owner.form.photoTooLarge',
};

/** Управление на снимките на вече съществуваща обява — влачене, основна снимка, добавяне и изтриване. */
export default function ListingPhotosManager({
  listingId,
  ownerId,
  onChanged,
}: ListingPhotosManagerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<ListingPhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPhotos(await getListingPhotos(listingId));
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [listingId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const items: PhotoSortItem[] = photos.map((photo) => ({ id: photo.id, url: photo.url }));

  const handleReorder = async (next: PhotoSortItem[]) => {
    const map = new Map(photos.map((photo) => [photo.id, photo]));
    const ordered = next
      .map((item) => map.get(item.id))
      .filter((photo): photo is ListingPhotoRow => Boolean(photo));
    if (ordered.length !== photos.length) return;

    const previous = photos;
    setPhotos(ordered.map((photo, index) => ({ ...photo, position: index })));
    setBusy(true);
    setError('');
    try {
      await reorderListingPhotos(ordered.map((photo) => photo.id));
      onChanged?.();
    } catch {
      setPhotos(previous);
      setError(t('owner.form.photoReorderError'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    const previous = photos;
    setPhotos(photos.filter((photo) => photo.id !== id));
    setBusy(true);
    setError('');
    try {
      await deleteListingPhoto(id);
      onChanged?.();
    } catch {
      setPhotos(previous);
      setError(t('owner.form.photoError'));
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (list: FileList | null) => {
    if (!list) return;
    setError('');
    const accepted: File[] = [];
    let firstError: PhotoValidationError | null = null;
    for (const file of Array.from(list)) {
      const problem = validatePhotoFile(file);
      if (problem) {
        if (!firstError) firstError = problem;
        continue;
      }
      accepted.push(file);
    }
    if (inputRef.current) inputRef.current.value = '';

    if (firstError) {
      setError(t(ERROR_KEY[firstError]));
      return;
    }
    if (accepted.length === 0) return;

    setBusy(true);
    try {
      const urls = await uploadListingPhotos(
        accepted.slice(0, PHOTO_LIMITS.maxCount),
        ownerId,
        listingId,
      );
      await addListingPhotos(listingId, urls);
      await load();
      onChanged?.();
    } catch {
      setError(t('owner.form.photoError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || photos.length >= PHOTO_LIMITS.maxCount}
          onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3.5 py-2 text-xs font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i
            className={busy ? 'ri-loader-4-line animate-spin text-sm' : 'ri-image-add-line text-sm'}
            aria-hidden="true"
          />
          {t('owner.addPhotos')}
        </button>
        <span className="text-xs text-foreground-500">
          {photos.length}/{PHOTO_LIMITS.maxCount}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => handleAdd(event.target.files)}
      />

      <p className="mt-2 text-xs text-foreground-500">{t('owner.form.reorderHint')}</p>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-accent-800">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-3 h-24 animate-pulse rounded-md border border-background-200 bg-background-100" />
      ) : photos.length === 0 ? (
        <p className="mt-3 rounded-md border border-background-200 bg-background-50 px-3.5 py-3 text-xs text-foreground-600">
          {t('owner.noPhotos')}
        </p>
      ) : (
        <div className="mt-3">
          <PhotoSortGrid
            items={items}
            onReorder={handleReorder}
            onRemove={handleRemove}
            disabled={busy}
          />
        </div>
      )}
    </div>
  );
}