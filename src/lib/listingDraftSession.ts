import type { ListingDraft } from './listingDraft';

const KEY = 'kb_listing_draft_v1';
export const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let activeOwner: string | null = null;
export interface SavedListingDraft { ownerId: string; updatedAt: number; draft: ListingDraft; step: number; requestId: string; createdId: string }

export function emptyListingDraft(): ListingDraft {
  const now = new Date();
  return { cityId: '', neighborhoodId: '', universityIds: [], title: '', description: '', type: 'apartment', price: '', area: '', rooms: '1', floor: '', totalFloors: '', deposit: '', availableFrom: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, furnished: true, pets: false, utilities: false };
}
function storage(): Storage | null { try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; } }

/** Auth changes fence old async callbacks and erase another account's draft. */
export function setListingDraftSession(ownerId: string | null): void {
  activeOwner = ownerId;
  try {
    const raw = storage()?.getItem(KEY);
    if (raw && (!ownerId || JSON.parse(raw).ownerId !== ownerId)) storage()?.removeItem(KEY);
  } catch { try { storage()?.removeItem(KEY); } catch { /* Storage disabled. */ } }
}
export function clearListingDraft(ownerId: string): void {
  if (activeOwner !== ownerId) return;
  try { storage()?.removeItem(KEY); } catch { /* Storage disabled. */ }
}
export function readListingDraft(ownerId: string, now = Date.now()): SavedListingDraft | null {
  if (activeOwner !== ownerId) return null;
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    if (raw.length > 16_000) throw new Error();
    const value = JSON.parse(raw), draft = value.draft, defaults = emptyListingDraft();
    if (value.version !== 1 || value.ownerId !== ownerId || !Number.isFinite(value.updatedAt) || value.updatedAt > now + 60_000 || now - value.updatedAt >= DRAFT_TTL_MS || !Number.isInteger(value.step) || value.step < 0 || value.step > 2 || !draft || typeof draft !== 'object') throw new Error();
    for (const [key, initial] of Object.entries(defaults)) {
      const field = draft[key];
      if (key === 'universityIds') {
        if (!Array.isArray(field) || field.length > 3 || field.some(id => typeof id !== 'string' || id.length > 80)) throw new Error();
      } else if (typeof field !== typeof initial || (typeof field === 'string' && field.length > (key === 'description' ? 5000 : key === 'title' ? 120 : 80))) throw new Error();
    }
    if (!['apartment', 'room', 'studio', 'house'].includes(draft.type) || typeof value.requestId !== 'string' || typeof value.createdId !== 'string' || (value.requestId && !UUID.test(value.requestId)) || (value.createdId && !UUID.test(value.createdId))) throw new Error();
    // Copy only the known fields; never merge arbitrary storage keys into state.
    return { ownerId, updatedAt: value.updatedAt, step: value.step, requestId: value.requestId, createdId: value.createdId, draft: Object.fromEntries(Object.keys(defaults).map(key => [key, draft[key]])) as unknown as ListingDraft };
  } catch { clearListingDraft(ownerId); return null; }
}
export function saveListingDraft(ownerId: string, value: Omit<SavedListingDraft, 'ownerId' | 'updatedAt'>): boolean {
  if (activeOwner !== ownerId) return false;
  try {
    const target = storage();
    if (!target) return false;
    const draft = Object.fromEntries(Object.keys(emptyListingDraft()).map(key => [key, value.draft[key]]));
    target.setItem(KEY, JSON.stringify({ version: 1, ownerId, updatedAt: Date.now(), draft, step: value.step, requestId: value.requestId, createdId: value.createdId }));
    return true;
  } catch { return false; }
}
