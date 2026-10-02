import { supabase } from '@/lib/supabase';
export interface ListingContact { display_name: string; phone: string | null; email: string | null }
export interface Thread { id: string; listing_id: string; owner_id: string; tenant_id: string; created_at: string; updated_at: string; listing: { title: string; slug: string } | null }
export interface ThreadMessage { id: string; conversation_id: string; sender_id: string; body: string; created_at: string }
export async function revealContact(listingId: string): Promise<ListingContact | null> {
  const { data, error } = await supabase.rpc('get_listing_contact', { p_listing_id: listingId });
  if (error) throw error;
  return (data?.[0] as ListingContact) ?? null;
}
export async function startConversation(listingId: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_conversation', { p_listing_id: listingId });
  if (error) throw error;
  return data as string;
}
export async function getThreads(offset = 0): Promise<Thread[]> {
  const { data, error } = await supabase.from('conversations').select('id,listing_id,owner_id,tenant_id,created_at,updated_at,listing:listings(title,slug)').order('updated_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 99);
  if (error) throw error;
  return (data ?? []) as unknown as Thread[];
}
export async function getThread(id: string): Promise<Thread | null> {
  const { data, error } = await supabase.from('conversations').select('id,listing_id,owner_id,tenant_id,created_at,updated_at,listing:listings(title,slug)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as Thread | null;
}
export async function getThreadMessages(id: string, before?: Pick<ThreadMessage, 'created_at' | 'id'>): Promise<ThreadMessage[]> {
  let query = supabase.from('messages').select('id,conversation_id,sender_id,body,created_at').eq('conversation_id', id);
  if (before) {
    if (!/^[0-9a-f-]{36}$/i.test(before.id) || !/^[0-9T:Z.+-]+$/.test(before.created_at) || !Number.isFinite(new Date(before.created_at).getTime())) throw new Error('Invalid message cursor');
    query = query.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
  }
  const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []).reverse() as ThreadMessage[];
}
export async function sendMessage(id: string, body: string, requestId: string): Promise<void> {
  const { error } = await supabase.rpc('send_message', { p_conversation_id: id, p_body: body, p_request_id: requestId });
  if (error) throw error;
}
