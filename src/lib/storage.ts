import { supabase } from './supabase';

/** Публично хранилище за снимките на обявите. */
const BUCKET = 'listing-photos';

export const PHOTO_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxCount: 15,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
} as const;

export type PhotoValidationError = 'unsupportedType' | 'tooLarge';

/** Проверява файл преди качване. Връща код на грешката или null, ако е валиден. */
export function validatePhotoFile(file: File): PhotoValidationError | null {
  if (!PHOTO_LIMITS.allowedTypes.includes(file.type as (typeof PHOTO_LIMITS.allowedTypes)[number])) {
    return 'unsupportedType';
  }
  if (file.size > PHOTO_LIMITS.maxBytes) {
    return 'tooLarge';
  }
  return null;
}

/** Прави низ безопасен за име на папка/файл в хранилището. */
function sanitizeSegment(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return cleaned || 'item';
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function extensionFor(file: File): string {
  const byType = EXTENSION_BY_TYPE[file.type];
  if (byType) return byType;
  const dot = file.name.lastIndexOf('.');
  const raw = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
  return /^[a-z0-9]{1,5}$/.test(raw) ? raw : 'jpg';
}

/** Качва една снимка и връща публичния ѝ адрес. */
export async function uploadListingPhoto(
  file: File,
  ownerId: string,
  listingId: string,
): Promise<string> {
  const folder = `${sanitizeSegment(ownerId)}/${sanitizeSegment(listingId)}`;
  const name = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file)}`;
  const path = `${folder}/${name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Качва няколко снимки последователно и връща адресите им. */
export async function uploadListingPhotos(
  files: File[],
  ownerId: string,
  listingId: string,
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadListingPhoto(file, ownerId, listingId);
    urls.push(url);
  }
  return urls;
}