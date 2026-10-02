import { supabase } from '@/lib/supabase';
import type { ListingStatus, Role, UserStatus } from '@/lib/types';

export interface AdminUserRow {
  id: string;
  name: string;
  role: Role;
  status: UserStatus;
  trustScore: number;
  ownerVerified: boolean;
  createdAt: string;
  phone: string | null;
  email: string | null;
}

interface ProfileRaw {
  id: string;
  name: string;
  role: string;
  status: string;
  trust_score: number;
  owner_verified: boolean;
  created_at: string;
}

interface ContactRaw {
  id: string;
  phone: string | null;
  email: string | null;
}

/** Пълен списък с потребители + контакти (само админ може да чете). */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const [profilesResult, contactsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, role, status, trust_score, owner_verified, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('profile_contacts').select('id, phone, email'),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (contactsResult.error) throw contactsResult.error;

  const contacts = new Map<string, ContactRaw>();
  for (const item of (contactsResult.data ?? []) as ContactRaw[]) {
    contacts.set(item.id, item);
  }

  return ((profilesResult.data ?? []) as ProfileRaw[]).map((row) => {
    const contact = contacts.get(row.id);
    return {
      id: row.id,
      name: row.name,
      role: row.role as Role,
      status: row.status as UserStatus,
      trustScore: row.trust_score,
      ownerVerified: row.owner_verified,
      createdAt: row.created_at,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
    };
  });
}

export interface AdminListingRow {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  priceEur: number;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  photoCount: number;
  propertyVerified: boolean;
}

interface ListingRaw {
  id: string;
  slug: string;
  title: string;
  status: string;
  price_eur: number | string;
  owner_id: string;
  created_at: string;
  ownership_verified_at: string | null;
  verification_expires_at: string | null;
  photos: { id: string }[] | null;
}

/** Всички обяви в системата — само за админ. */
export async function getAdminListings(): Promise<AdminListingRow[]> {
  const [listingsResult, profilesResult] = await Promise.all([
    supabase
      .from('listings')
      .select('id, slug, title, status, price_eur, owner_id, created_at, ownership_verified_at, verification_expires_at, photos:listing_photos(id)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name'),
  ]);
  if (listingsResult.error) throw listingsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const names = new Map<string, string>();
  for (const item of (profilesResult.data ?? []) as { id: string; name: string }[]) {
    names.set(item.id, item.name);
  }

  return ((listingsResult.data ?? []) as ListingRaw[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status as ListingStatus,
    priceEur: typeof row.price_eur === 'string' ? Number(row.price_eur) : row.price_eur,
    ownerId: row.owner_id,
    ownerName: names.get(row.owner_id) ?? 'Неизвестен',
    createdAt: row.created_at,
    photoCount: row.photos?.length ?? 0,
    propertyVerified: Boolean(row.ownership_verified_at && row.verification_expires_at && Date.parse(row.verification_expires_at) > Date.now()),
  }));
}

export async function setUserRole(userId: string, role: Role, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user', { p_id: userId, p_role: role, p_status: null, p_reason: reason });
  if (error) throw error;
}
export async function setUserStatus(userId: string, status: UserStatus, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user', { p_id: userId, p_role: null, p_status: status, p_reason: reason });
  if (error) throw error;
}
export async function setListingStatus(listingId: string, status: ListingStatus, reason: string): Promise<void> {
  const { error } = await supabase.rpc('moderate_listing', { p_id: listingId, p_status: status, p_reason: reason });
  if (error) throw error;
}
export async function deleteListing(listingId: string, reason: string): Promise<void> {
  await setListingStatus(listingId, 'removed', reason);
}
export async function verifyListing(listingId: string, method: string, evidenceReference: string): Promise<void> {
  const { error } = await supabase.rpc('verify_listing', { p_id: listingId, p_method: method, p_evidence_reference: evidenceReference });
  if (error) throw error;
}
