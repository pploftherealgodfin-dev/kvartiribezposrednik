import { supabase } from '@/lib/supabase';

export interface ReportRow {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string | null;
  reporterId: string | null;
  reason: string;
  details: string;
  resolution_note: string | null;
  status: string;
  createdAt: string;
}

interface ReportRaw {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  details: string;
  resolution_note: string | null;
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
      details: row.details,
      resolution_note: row.resolution_note,
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

/** Докладите, подадени от конкретен потребител. */
export async function getMyReports(userId: string): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('id, listing_id, reporter_id, reason, details, resolution_note, status, created_at')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return attachListingMeta((data ?? []) as ReportRaw[]);
}

/** Всички доклади — само за админ. */
export async function getAllReports(): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('id, listing_id, reporter_id, reason, details, resolution_note, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return attachListingMeta((data ?? []) as ReportRaw[]);
}

export async function submitReport(listingId: string | null, reason: string, details: string, listingUrl: string | null = null): Promise<string> {
  const { data, error } = await supabase.rpc('submit_report', {
    p_listing_id: listingId, p_reason: reason, p_details: details, p_listing_url: listingUrl,
  });
  if (error) throw error;
  return data as string;
}
export async function createReport(listingId: string, _reporterId: string, reason: string, details: string): Promise<string> {
  return submitReport(listingId, reason, details);
}
export async function setReportStatus(reportId: string, status: string, _resolvedBy: string | null, reason: string): Promise<void> {
  const { error } = await supabase.rpc('resolve_report', { p_id: reportId, p_status: status, p_reason: reason });
  if (error) throw error;
}
