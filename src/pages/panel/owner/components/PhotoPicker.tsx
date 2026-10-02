import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PHOTO_LIMITS, validatePhotoFile, type PhotoValidationError } from '@/lib/storage';
import PhotoSortGrid, { type PhotoSortItem } from './PhotoSortGrid';

export interface PickedPhoto {
  id: string;
  file: File;
  url: string;
}

interface PhotoPickerProps {
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
  disabled?: boolean;
}

const ERROR_KEY: Record<PhotoValidationError, string> = {
  unsupportedType: 'owner.form.photoBadType',
  tooLarge: 'owner.form.photoTooLarge',
};

export default function PhotoPicker({ photos, onChange, disabled }: PhotoPickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    },
    [],
  );

  const handleSelect = (list: FileList | null) => {
    if (!list) return;
    setError('');
    const accepted: PickedPhoto[] = [];
    let firstError: PhotoValidationError | null = null;

    for (const file of Array.from(list)) {
      const problem = validatePhotoFile(file);
      if (problem) {
        if (!firstError) firstError = problem;
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
    }

    const room = PHOTO_LIMITS.maxCount - photos.length;
    const kept = accepted.slice(0, Math.max(0, room));
    accepted.slice(kept.length).forEach((photo) => URL.revokeObjectURL(photo.url));
    if (kept.length > 0) onChange([...photos, ...kept]);

    if (firstError) setError(t(ERROR_KEY[firstError]));
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (id: string) => {
    const target = photos.find((photo) => photo.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(photos.filter((photo) => photo.id !== id));
  };

  const handleReorder = (items: PhotoSortItem[]) => {
    const map = new Map(photos.map((photo) => [photo.id, photo]));
    const next = items
      .map((item) => map.get(item.id))
      .filter((photo): photo is PickedPhoto => Boolean(photo));
    if (next.length === photos.length) onChange(next);
  };

  const items: PhotoSortItem[] = photos.map((photo) => ({ id: photo.id, url: photo.url }));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || photos.length >= PHOTO_LIMITS.maxCount}
          onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-background-300 bg-background-50 px-4 py-2.5 text-sm font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className="ri-image-add-line text-base" aria-hidden="true" />
          {t('owner.form.addPhotos')}
        </button>
        <span className="text-xs text-foreground-500">
          {photos.length}/{PHOTO_LIMITS.maxCount}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => handleSelect(event.target.files)}
      />

      <p className="mt-2 text-xs text-foreground-500">{t('owner.form.photosHint')}</p>
      <p className="mt-1 text-xs text-foreground-500">{t('owner.form.reorderHint')}</p>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-accent-800">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-3">
          <PhotoSortGrid
            items={items}
            onReorder={handleReorder}
            onRemove={handleRemove}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}