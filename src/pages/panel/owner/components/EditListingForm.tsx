import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toListingInput, validateListingDraft, type ListingDraft, type DraftIssue } from '@/lib/listingDraft';
import { updateOwnerListing, type EditableOwnerListing } from '@/lib/repository/owner';
import type { City, Neighborhood, University } from '@/lib/types';
import ListingDetailsFields from './ListingDetailsFields';
interface Props { listing: EditableOwnerListing; cities: City[]; neighborhoods: Neighborhood[]; universities: University[]; onSaved: () => void; onCancel: () => void }
export default function EditListingForm({ listing, cities, neighborhoods, universities, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState(listing.draft);
  const [issue, setIssue] = useState<DraftIssue | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [confirmed, setConfirmed] = useState(false);
  const locked = useRef(false), alive = useRef(true), requestId = useRef(''), finished = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(listing.draft);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (issue) document.getElementById(issue.field)?.focus(); }, [issue]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { if (!finished.current) event.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const update = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => { setDraft(old => ({ ...old, [key]: value })); setConfirmed(false); requestId.current = ''; };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (locked.current) return;
    for (const step of [0, 1]) { const problem = validateListingDraft(draft, step, cities, neighborhoods, universities, listing.photoCount); if (problem) { setIssue(problem); setError(problem.message); return; } }
    if (!confirmed) { setError('Потвърди условията и повторния преглед на обявата.'); return; }
    if (!navigator.onLine) { setError('Няма интернет. Данните остават във формата; опитай отново при връзка.'); return; }
    locked.current = true; setBusy(true); setError(''); setIssue(null);
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try { await updateOwnerListing(listing.id, toListingInput(draft), requestId.current); if (alive.current) { finished.current = true; onSaved(); } }
    catch { if (alive.current) setError('Записът не е потвърден. Опитай отново със същите данни или провери обявата в панела.'); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  return <form onSubmit={save} noValidate aria-busy={busy} className="ui-panel mt-6">
    <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm leading-relaxed text-primary-900"><p>Редактираш същата обява. След запис тя преминава в преглед; дотогава текущата публична версия остава видима, ако е активна.</p><p className="mt-2">Снимките се запазват. Можеш да ги промениш от <Link className="underline" to="/panel/naemodatel">„Моите обяви“</Link> след записа.</p></div>
    <fieldset disabled={busy}><ListingDetailsFields draft={draft} issue={issue} cities={cities} neighborhoods={neighborhoods} universities={universities} onChange={update} />
    <label className="mt-6 flex min-h-12 items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Данните описват реалния имот. Приемам повторния преглед; това не е нова обява.</span></label></fieldset>
    {error && <p role="alert" id="listing-form-error" className="mt-5 rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-3"><button type="submit" disabled={busy || !confirmed} className="ui-button">{busy ? 'Записваме промените…' : 'Запази и изпрати за преглед'}</button><button type="button" disabled={busy} onClick={onCancel} className="ui-secondary">Към панела</button></div>
  </form>;
}
