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

const preparedPhotos = new WeakSet<File>();

/** Decode before creating the listing; re-encode pixels to remove EXIF/GPS. */
export async function prepareListingPhoto(file: File): Promise<File> {
  const problem = validatePhotoFile(file);
  if (problem) throw new Error(problem === 'tooLarge' ? 'Снимката е над 5 MB.' : 'Използвайте JPEG, PNG или WebP.');
  if (preparedPhotos.has(file)) return file;
  const url = URL.createObjectURL(file);
  try {
    const picture = new Image(); picture.src = url; await picture.decode();
    if (!picture.naturalWidth || !picture.naturalHeight || picture.naturalWidth * picture.naturalHeight > 40_000_000) throw new Error('Снимката е прекалено голяма за обработка.');
    const scale = Math.min(1, 2560 / Math.max(picture.naturalWidth, picture.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(picture.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(picture.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Браузърът не може да обработи снимката.');
    context.drawImage(picture, 0, 0, canvas.width, canvas.height);
    const encoded = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Снимката не може да бъде обработена.')), file.type, 0.9));
    if (encoded.size > PHOTO_LIMITS.maxBytes) throw new Error('Обработената снимка е над 5 MB.');
    const prepared = new File([encoded], 'photo', { type: encoded.type });
    preparedPhotos.add(prepared);
    return prepared;
  } finally { URL.revokeObjectURL(url); }
}

/** Качва една снимка и връща постоянния Storage path. */
export async function uploadListingPhoto(
  file: File,
  ownerId: string,
  listingId: string,
): Promise<string> {
  const safeFile = await prepareListingPhoto(file);
  const folder = `${sanitizeSegment(ownerId)}/${sanitizeSegment(listingId)}`;
  const name = `${crypto.randomUUID()}.${extensionFor(safeFile)}`;
  const path = `${folder}/${name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, safeFile, {
    cacheControl: '3600',
    upsert: false,
    contentType: safeFile.type,
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
  const paths: string[] = [];
  try {
    for (const file of files) paths.push(await uploadListingPhoto(file, ownerId, listingId));
    return paths;
  } catch (error) {
    // Only unlinked objects created by this request are eligible for cleanup.
    await Promise.allSettled(paths.map(removePhotoObject));
    throw error;
  }
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
