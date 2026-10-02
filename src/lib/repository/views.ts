import { supabase } from '@/lib/supabase';

/**
 * Отчита едно отваряне на обява. Грешките не се хвърлят —
 * отчитането не бива да чупи страницата на обявата.
 */
export async function recordListingView(
  listingId: string,
  viewerId: string | null,
): Promise<void> {
  await supabase.from('listing_views').insert({ listing_id: listingId, viewer_id: viewerId });
}