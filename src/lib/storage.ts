import { supabase } from './supabase';

/** Частно хранилище; достъпът до всяка снимка се проверява от RLS. */
const BUCKET = 'listing-photos';

export const PHOTO_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxCount: 15,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
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
};

function extensionFor(file: File): string {
  const byType = EXTENSION_BY_TYPE[file.type];
  if (byType) return byType;
  const dot = file.name.lastIndexOf('.');
  const raw = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
  return /^[a-z0-9]{1,5}$/.test(raw) ? raw : 'jpg';
}

/** Качва една снимка и връща постоянния Storage path. */
export async function uploadListingPhoto(
  file: File,
  ownerId: string,
  listingId: string,
): Promise<string> {
  const problem = validatePhotoFile(file);
  if (problem) throw new Error(problem === 'tooLarge' ? 'Снимката е над 5 MB.' : 'Използвайте JPEG, PNG или WebP.');
  const folder = `${sanitizeSegment(ownerId)}/${sanitizeSegment(listingId)}`;
  const name = `${crypto.randomUUID()}.${extensionFor(file)}`;
  const path = `${folder}/${name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  return path;
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
/** URLs expire after five minutes; paths, not bearer URLs, are stored in Postgres. */
export async function signPhotoPaths(paths: string[]): Promise<Map<string, string>> {
  if (!paths.length) return new Map();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls([...new Set(paths)], 300);
  if (error) throw error;
  return new Map((data ?? []).filter(item => item.signedUrl && item.path).map(item => [item.path!, item.signedUrl]));
}
export async function removePhotoObject(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
