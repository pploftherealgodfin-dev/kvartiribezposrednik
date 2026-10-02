import { supabase } from '@/lib/supabase';

export interface ReportRow {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string | null;
  reporterId: string | null;
  reason: string;
  status: string;
  createdAt: string;
}

interface ReportRaw {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  status: string;
  created_at: string;
}

interface ListingMeta {
  id: string;
  title: string;
  slug: string;
}

async function attachListingMeta(rows: ReportRaw[]): Promise<ReportRow[]> {
  const ids = Array.from(new Set(rows.map((row) => row.listing_id)));
  const metaMap = new Map<string, ListingMeta>();
  if (ids.length > 0) {
    const { data } = await supabase.from('listings').select('id, title, slug').in('id', ids);
    for (const item of (data ?? []) as ListingMeta[]) {
      metaMap.set(item.id, item);
    }
  }
  return rows.map((row) => {
    const meta = metaMap.get(row.listing_id);
    return {
      id: row.id,
      listingId: row.listing_id,
      listingTitle: meta?.title ?? 'Изтрита обява',
      listingSlug: meta?.slug ?? null,
      reporterId: row.reporter_id,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

/** Докладите, подадени от конкретен потребител. */
export async function getMyReports(userId: string): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('id, listing_id, reporter_id, reason, status, created_at')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return attachListingMeta((data ?? []) as ReportRaw[]);
}

/** Всички доклади — само за админ. */
export async function getAllReports(): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('id, listing_id, reporter_id, reason, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return attachListingMeta((data ?? []) as ReportRaw[]);
}

export async function createReport(
  listingId: string,
  reporterId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    id: crypto.randomUUID(),
    listing_id: listingId,
    reporter_id: reporterId,
    reason,
    status: 'open',
  });
  if (error) throw error;
}

export async function setReportStatus(
  reportId: string,
  status: string,
  resolvedBy: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ status, resolved_by: resolvedBy })
    .eq('id', reportId);
  if (error) throw error;
}