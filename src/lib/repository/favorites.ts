import { supabase } from '@/lib/supabase';

/** Всички обяви, запазени от даден потребител. */
export async function getFavoriteListingIds(userId: string): Promise<string[]> {
  const ids: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', userId).order('listing_id').range(offset, offset + 999);
    if (error) throw error;
    ids.push(...(data ?? []).map(row => row.listing_id as string));
    if ((data?.length ?? 0) < 1000) break;
  }
  return ids;
}

export async function isFavorite(userId: string, listingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function addFavorite(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .upsert(
      { user_id: userId, listing_id: listingId },
      { onConflict: 'user_id,listing_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function removeFavorite(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);
  if (error) throw error;
}