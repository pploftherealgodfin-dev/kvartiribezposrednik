import { supabase } from './supabase';
export const LISTING_PHOTO_BUCKET = 'listing-photos';

/** Short-lived, access-checked URLs stay separate from upload/canvas code. */
export async function signPhotoPaths(paths: string[]): Promise<Map<string, string>> {
  if (!paths.length) return new Map();
  const { data, error } = await supabase.storage.from(LISTING_PHOTO_BUCKET).createSignedUrls([...new Set(paths)], 300);
  if (error) throw error;
  return new Map((data ?? []).filter(item => item.signedUrl && item.path).map(item => [item.path!, item.signedUrl]));
}
export async function refreshListingPhoto(photoId: string): Promise<string> {
  const { data, error } = await supabase.from('listing_photos').select('storage_path').eq('id', photoId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Снимката вече не е достъпна.');
  const url = (await signPhotoPaths([data.storage_path])).get(data.storage_path);
  if (!url) throw new Error('Снимката не се зареди.');
  return url;
}
export async function removePhotoObject(path: string): Promise<void> {
  const { error } = await supabase.storage.from(LISTING_PHOTO_BUCKET).remove([path]);
  if (error) throw error;
}
