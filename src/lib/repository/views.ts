import { supabase } from '@/lib/supabase';

/**
 * Отчита едно отваряне на обява. Грешките не се хвърлят —
 * отчитането не бива да чупи страницата на обявата.
 */
export async function recordListingView(
  listingId: string,
  viewerId: string | null,
): Promise<void> {
  if (!viewerId) return;
  await supabase.rpc('record_listing_view', { p_id: listingId });
}