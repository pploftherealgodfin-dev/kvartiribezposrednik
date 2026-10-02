import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PHOTO_LIMITS, prepareListingPhoto, validatePhotoFile, type PhotoValidationError } from '@/lib/storage';
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
  onProcessingChange?: (processing: boolean) => void;
}

const ERROR_KEY: Record<PhotoValidationError, string> = {
  unsupportedType: 'owner.form.photoBadType',
  tooLarge: 'owner.form.photoTooLarge',
  empty: 'owner.form.photoBadType',
};

export default function PhotoPicker({ photos, onChange, disabled, onProcessingChange }: PhotoPickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const processingRef = useRef(false);
  const mounted = useRef(true);

  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, []);

  const handleSelect = async (list: FileList | null) => {
    if (!list || disabled || processingRef.current) return;
    const files = Array.from(list);
    processingRef.current = true;
    setProcessing(true);
    onProcessingChange?.(true);
    setError('');
    const accepted: PickedPhoto[] = [];
    let firstError = '';
    const room = Math.max(0, PHOTO_LIMITS.maxCount - photosRef.current.length);
    for (const [index, file] of files.entries()) {
      if (accepted.length >= room) {
        firstError ||= `Можеш да добавиш до ${PHOTO_LIMITS.maxCount} снимки. Останалите не са добавени.`;
        break;
      }
      setProgress({ current: index + 1, total: Math.min(files.length, room) });
      const problem = validatePhotoFile(file);
      if (problem) {
        firstError ||= problem === 'empty' ? 'Избраният файл е празен.' : t(ERROR_KEY[problem]);
        continue;
      }
      try {
        const prepared = await prepareListingPhoto(file);
        if (!mounted.current) break;
        accepted.push({ id: crypto.randomUUID(), file: prepared, url: URL.createObjectURL(prepared) });
      } catch (error) {
        firstError ||= error instanceof Error && /^[А-Яа-я]/.test(error.message) ? error.message : 'Една от снимките не може да се обработи. Избери валидна JPEG, PNG или WebP снимка до 5 MB и 40 мегапиксела.';
      }
      if (!mounted.current) break;
    }
    processingRef.current = false;
    if (!mounted.current) {
      accepted.forEach(photo => URL.revokeObjectURL(photo.url));
      return;
    }
    if (accepted.length) onChange([...photosRef.current, ...accepted]);
    setError(firstError);
    setProcessing(false);
    onProcessingChange?.(false);
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
          disabled={disabled || processing || photos.length >= PHOTO_LIMITS.maxCount}
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
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || processing}
        className="hidden"
        onChange={(event) => handleSelect(event.target.files)}
      />

      <p className="mt-2 text-xs text-foreground-500">{t('owner.form.photosHint')}</p>
      <p className="mt-1 text-xs text-foreground-500">{t('owner.form.reorderHint')}</p>
      {processing && <p role="status" className="mt-2 text-sm text-primary-700">Подготвяме снимка {progress.current} от {progress.total}…</p>}
      <p className="mt-2 text-xs text-foreground-500">Намаляваме размера за бързо зареждане и премахваме EXIF данните за местоположение. Не качвай документи или снимки с лични данни.</p>

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
            disabled={disabled || processing}
          />
        </div>
      )}
    </div>
  );
}
