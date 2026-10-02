import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import ListingDetailsFields from './ListingDetailsFields';
import OwnerPublishingTips from './OwnerPublishingTips';
import { addListingPhotos, createOwnerListing } from '@/lib/repository/owner';
import { uploadListingPhotos } from '@/lib/storage';
import { validateListingDraft, toListingInput, type ListingDraft, type DraftIssue } from '@/lib/listingDraft';
import { clearListingDraft, emptyListingDraft, readListingDraft, saveListingDraft } from '@/lib/listingDraftSession';
import type { City, Neighborhood, University } from '@/lib/types';
import type { PickedPhoto } from './PhotoPicker';

const PhotoPicker = lazy(() => import('./PhotoPicker'));
interface Props { ownerId: string; cities: City[]; neighborhoods: Neighborhood[]; universities: University[]; onCreated: () => void; onCancel: () => void }
const steps = ['Жилище', 'Снимки', 'Преглед'];

export default function ListingForm({ ownerId, cities, neighborhoods, universities, onCreated, onCancel }: Props) {
  const [saved] = useState(() => readListingDraft(ownerId));
  const [draft, setDraft] = useState<ListingDraft>(() => saved?.draft ?? emptyListingDraft());
  const [step, setStep] = useState(() => saved?.createdId ? 2 : Math.min(saved?.step ?? 0, 1));
  const [photoReady, setPhotoReady] = useState(Boolean(saved && (saved.createdId || saved.step >= 1)));
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [issue, setIssue] = useState<DraftIssue | null>(null);
  const [createdId, setCreatedId] = useState(saved?.createdId ?? '');
  const [restored, setRestored] = useState(Boolean(saved));
  const [savedLocally, setSavedLocally] = useState(Boolean(saved));
  const requestId = useRef(saved?.requestId ?? '');
  const submitLocked = useRef(false);
  const alive = useRef(true);
  const finished = useRef(false);
  const section = useRef<HTMLDivElement>(null);
  const snapshot = useRef({ draft, step, requestId: requestId.current, createdId });
  snapshot.current = { draft, step, requestId: requestId.current, createdId };
  const dirty = Boolean(draft.title || draft.description || draft.cityId || createdId);
  const update = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    setDraft(old => ({ ...old, [key]: value })); setConfirmed(false);
  };
  useEffect(() => { if (issue) document.getElementById(issue.field)?.focus(); }, [issue]);
  useEffect(() => {
    alive.current = true;
    const flush = () => {
      const current = snapshot.current;
      if (!finished.current && (current.draft.title || current.draft.description || current.draft.cityId || current.createdId)) saveListingDraft(ownerId, current);
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', onVisibility);
    return () => {
      alive.current = false; flush();
      window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ownerId]);
  useEffect(() => {
    if (!dirty || finished.current) return;
    const timer = window.setTimeout(() => setSavedLocally(saveListingDraft(ownerId, snapshot.current)), 350);
    return () => window.clearTimeout(timer);
  }, [ownerId, draft, step, createdId, dirty]);
  useEffect(() => {
    if (createdId || (!photos.length && (!dirty || savedLocally))) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, savedLocally, photos.length, createdId]);

  const move = (next: number) => {
    if (next >= 1) setPhotoReady(true);
    setStep(next); setError(''); setIssue(null);
    requestAnimationFrame(() => section.current?.focus());
  };
  const check = (index: number) => {
    for (const rule of index === 0 ? [0, 1] : [2]) {
      const problem = validateListingDraft(draft, rule, cities, neighborhoods, universities, photos.length);
      if (problem) { setStep(index); setIssue(problem); setError(problem.message); return false; }
    }
    return true;
  };
  const resetDraft = () => {
    clearListingDraft(ownerId);
    photos.forEach(photo => URL.revokeObjectURL(photo.url));
    requestId.current = ''; setCreatedId(''); setDraft(emptyListingDraft()); setPhotos([]);
    setConfirmed(false); setRestored(false); setSavedLocally(false); move(0);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitLocked.current || busy || photoBusy) return;
    if (createdId) { onCancel(); return; }
    if (step < 2) { if (check(step)) move(step + 1); return; }
    for (let index = 0; index < 2; index++) if (!check(index)) return;
    if (!confirmed) { setError('Потвърди, че описанието и снимките са на реалния имот.'); return; }
    if (!navigator.onLine) { setError('Няма връзка с интернет. Опитай отново при свързване; данните остават във формата.'); return; }
    submitLocked.current = true; setBusy(true); setError(''); setProgress('Записваме обявата…');
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      snapshot.current = { draft, step, requestId: requestId.current, createdId: '' };
      saveListingDraft(ownerId, { draft, step, requestId: requestId.current, createdId: '' });
      const listing = await createOwnerListing(ownerId, toListingInput(draft), requestId.current);
      if (!alive.current) return;
      setCreatedId(listing.id);
      snapshot.current = { draft, step, requestId: requestId.current, createdId: listing.id };
      saveListingDraft(ownerId, { draft, step, requestId: requestId.current, createdId: listing.id });
      try {
        setProgress('Качваме снимките…');
        const urls = await uploadListingPhotos(photos.map(photo => photo.file), ownerId, listing.id);
        await addListingPhotos(listing.id, urls);
      } catch {
        if (alive.current) setError('Обявата е записана, но качването на снимките не е потвърдено. Провери я в „Моите обяви“, преди да добавяш снимките отново.');
        return;
      }
      if (!alive.current) return;
      finished.current = true; clearListingDraft(ownerId); onCreated();
    } catch (err) {
      if (alive.current) setError(err instanceof Error && err.message.startsWith('Тази обява вече е записана') ? err.message : err instanceof Error && err.message.includes('всеки акаунт има една обява') ? err.message : 'Записът не е потвърден. Провери връзката и опитай отново; данните остават във формата.');
    } finally {
      submitLocked.current = false;
      if (alive.current) { setBusy(false); setProgress(''); }
    }
  };
  const city = cities.find(item => item.id === draft.cityId);
  const hood = neighborhoods.find(item => item.id === draft.neighborhoodId);
  const uniNames = universities.filter(item => draft.universityIds.includes(item.id)).map(item => item.name);

  return <form onSubmit={submit} noValidate aria-busy={busy || photoBusy} className="ui-panel mt-6">
    <ol aria-label="Стъпки за качване" className="mb-6 grid grid-cols-3 gap-3">{steps.map((label, index) => <li key={label}><button type="button" disabled={busy || photoBusy || Boolean(createdId) || index > step} onClick={() => move(index)} aria-current={index === step ? 'step' : undefined} className={'w-full border-b-2 pb-3 text-left text-sm ' + (index === step ? 'border-primary-600 font-semibold text-primary-800' : 'border-background-200 text-foreground-500')}><span className="mb-1 block text-xs">{index + 1} / 3</span>{label}</button></li>)}</ol>
    {createdId && !busy ? <div role="status" className="mb-6 rounded-lg bg-primary-50 p-4 text-sm text-primary-900"><strong>Обявата вече е записана.</strong><p className="mt-2">Провери статуса и снимките в „Моите обяви“. Не е нужно да я изпращаш отново.</p></div>
      : restored && <p role="status" className="mb-5 rounded-lg bg-primary-50 p-4 text-sm">Възстановихме черновата в този раздел. Избери снимките отново — те не се пазят в браузъра.</p>}
    <div ref={section} tabIndex={-1} className="outline-none"><p className="ui-note">Стъпка {step + 1} от 3</p><h2 className="mb-6 mt-1 font-heading text-xl font-semibold">{steps[step]}</h2></div>
    <fieldset disabled={busy || Boolean(createdId)} hidden={step !== 0} className="space-y-5">
      <ListingDetailsFields draft={draft} issue={issue} cities={cities} neighborhoods={neighborhoods} universities={universities} onChange={update} />
    </fieldset>
    <fieldset disabled={busy || Boolean(createdId)} hidden={step !== 1}>
      <div className="mb-5"><OwnerPublishingTips topic="photos" /></div>
      <div id="nf-photos" tabIndex={-1}>{photoReady && <Suspense fallback={<p role="status" className="min-h-24">Подготвяме избора на снимки…</p>}><PhotoPicker photos={photos} onChange={value => { setPhotos(value); setConfirmed(false); }} onProcessingChange={setPhotoBusy} disabled={busy || Boolean(createdId)} /></Suspense>}</div>
      <p className="ui-note mt-4">Добави поне една реална снимка. Първата е корицата. Можеш да добавиш още по-късно.</p>
    </fieldset>
    <fieldset disabled={busy || Boolean(createdId)} hidden={step !== 2}>
      <div className="rounded-lg bg-background-100 p-5"><p className="text-xs text-foreground-600">{city?.name}{hood ? ' · ' + hood.name : ''}</p><h3 className="mt-2 break-words text-lg font-semibold">{draft.title}</h3><p className="mt-3 font-semibold text-primary-800">{draft.price} € / месец · {draft.area} m² · {draft.rooms} стаи</p><p className="mt-3 whitespace-pre-wrap break-words text-sm text-foreground-700">{draft.description}</p><p className="ui-note mt-3">Свободно от: {draft.availableFrom} · Депозит: {draft.deposit === '' ? 'не е посочен' : draft.deposit + ' €'}</p>{uniNames.length > 0 && <p className="ui-note mt-3">Учебни локации: {uniNames.join('; ')}</p>}{photos[0] && <img src={photos[0].url} alt="Корична снимка на обявата" width={640} height={360} decoding="async" className="mt-4 aspect-video max-h-52 w-full rounded-lg object-cover" />}</div>
      {!createdId && <><div className="mt-4 flex gap-4"><button type="button" disabled={busy} className="min-h-11 text-sm text-primary-800 underline" onClick={() => move(0)}>Редактирай жилището</button><button type="button" disabled={busy} className="min-h-11 text-sm text-primary-800 underline" onClick={() => move(1)}>Редактирай снимките</button></div><label className="mt-4 flex min-h-12 items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Описанието и снимките са на реалния имот и условията са точни. Обявата ще стане публична след преглед.</span></label><p className="ui-note mt-3">Телефонът и имейлът се показват само след вход. <Link to="/nastroyki" target="_blank" rel="noopener noreferrer" className="underline">Настройки на контакта (нов раздел)</Link></p></>}
    </fieldset>
    {error && <p id="listing-form-error" role="alert" className="mt-5 rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm">{error}</p>}
    <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-background-200 pt-5">
      {step > 0 && !createdId && <button type="button" disabled={busy || photoBusy} onClick={() => move(step - 1)} className="ui-secondary">Назад</button>}
      <button type="submit" disabled={busy || photoBusy} className="ui-button flex-1 sm:flex-none">{busy ? progress : createdId ? 'Към моите обяви' : step < 2 ? 'Продължи' : 'Изпрати за преглед'}</button>
      <button type="button" disabled={busy || photoBusy} onClick={onCancel} className="ml-auto min-h-11 px-2 text-sm text-foreground-600">Към панела</button>
    </div>
    {!busy && dirty && <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-600"><p role="status">{savedLocally ? 'Текстът се пази в този раздел за 2 часа. Снимките се избират отново след презареждане.' : 'Черновата е във формата. Запазването в раздела може да е изключено от браузъра.'}</p><button type="button" disabled={photoBusy} onClick={resetDraft} className="min-h-11 text-primary-800 underline">{createdId ? 'Започни нова обява' : 'Изтрий черновата'}</button></div>}
    <p className="ui-note mt-4">Квартали: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors, ODbL</a>. Каталогът може да е непълен.</p>
  </form>;
}
