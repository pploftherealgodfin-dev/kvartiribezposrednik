import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import CityLocationFields from '@/components/feature/CityLocationFields';
import { addListingPhotos, createOwnerListing } from '@/lib/repository/owner';
import { uploadListingPhotos } from '@/lib/storage';
import { validateListingDraft, toListingInput, type ListingDraft, type DraftIssue } from '@/lib/listingDraft';
import type { City, Neighborhood, University, ListingType } from '@/lib/types';
import PhotoPicker, { type PickedPhoto } from './PhotoPicker';
interface Props { ownerId: string; cities: City[]; neighborhoods: Neighborhood[]; universities: University[]; onCreated: () => void; onCancel: () => void }
const steps = ['Локация', 'Жилище и условия', 'Снимки', 'Преглед'];
const types: {value: ListingType; label: string}[] = [{value:'apartment',label:'Апартамент'},{value:'room',label:'Стая'},{value:'studio',label:'Студио'},{value:'house',label:'Къща'}];
export default function ListingForm({ ownerId, cities, neighborhoods, universities, onCreated, onCancel }: Props) {
  const [draft, setDraft] = useState<ListingDraft>(() => { const now = new Date(); return { cityId:'', neighborhoodId:'', universityIds:[], title:'', description:'', type:'apartment', price:'', area:'', rooms:'1', floor:'', totalFloors:'', deposit:'', availableFrom: now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0'), furnished:true, pets:false, utilities:false }; });
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [issue, setIssue] = useState<DraftIssue | null>(null);
  const [createdId, setCreatedId] = useState('');
  const requestId = useRef('');
  const section = useRef<HTMLDivElement>(null);
  const update = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => setDraft(old => ({ ...old, [key]: value }));
  useEffect(() => { if (issue) document.getElementById(issue.field)?.focus(); }, [issue]);
  useEffect(() => {
    if (!draft.title && !draft.cityId && !photos.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [draft.title, draft.cityId, photos.length]);
  const move = (next: number) => { setStep(next); setError(''); setIssue(null); requestAnimationFrame(() => section.current?.focus()); };
  const check = (index: number) => {
    const problem = validateListingDraft(draft, index, cities, neighborhoods, universities, photos.length);
    if (problem) { setStep(index); setIssue(problem); setError(problem.message); return false; } return true;
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy || photoBusy) return;
    if (createdId) { onCancel(); return; }
    if (step < 3) { if (check(step)) move(step + 1); return; }
    for (let index=0; index<3; index++) if (!check(index)) return;
    if (!confirmed) { setError('Потвърди, че описанието и снимките са на реалния имот.'); return; }
    if (!navigator.onLine) { setError('Няма връзка с интернет. Данните са запазени в тази форма; опитай отново при свързване.'); return; }
    setBusy(true); setError(''); setProgress('Записваме обявата…');
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const listing = await createOwnerListing(ownerId, toListingInput(draft), requestId.current);
      try {
        setProgress('Качваме снимките…');
        const urls = await uploadListingPhotos(photos.map(photo => photo.file), ownerId, listing.id);
        await addListingPhotos(listing.id, urls);
      } catch { setCreatedId(listing.id); setError('Обявата е записана, но качването на снимките не е потвърдено. Провери я в „Моите обяви“, преди да добавяш снимките отново.'); return; }
      onCreated();
    } catch (err) { setError(err instanceof Error && err.message.startsWith('Тази обява вече е записана') ? err.message : 'Записът не е потвърден. Провери връзката и опитай отново; данните остават във формата.'); }
    finally { setBusy(false); setProgress(''); }
  };
  const city = cities.find(item => item.id === draft.cityId);
  const hood = neighborhoods.find(item => item.id === draft.neighborhoodId);
  const uniNames = universities.filter(item => draft.universityIds.includes(item.id)).map(item => item.name);
  const input = (key: 'title'|'price'|'area'|'rooms'|'floor'|'totalFloors'|'deposit'|'availableFrom', label: string, attrs: Record<string, string | number> = {}) => <div><label htmlFor={'nf-' + (key === 'availableFrom' ? 'available' : key === 'totalFloors' ? 'total-floors' : key)} className="ui-label">{label}</label><input id={'nf-' + (key === 'availableFrom' ? 'available' : key === 'totalFloors' ? 'total-floors' : key)} className="ui-field" value={draft[key]} onChange={event => update(key,event.target.value)} {...attrs} /></div>;
  return <form onSubmit={submit} noValidate aria-busy={busy} className="ui-panel mt-6">
    <ol aria-label="Стъпки за качване" className="mb-7 grid grid-cols-4 gap-2">{steps.map((label,index) => <li key={label}><button type="button" disabled={busy || photoBusy || index > step} onClick={() => move(index)} aria-current={index === step ? 'step' : undefined} className={'w-full border-b-2 pb-3 text-left text-xs sm:text-sm ' + (index === step ? 'border-primary-600 font-semibold text-primary-800' : 'border-background-200 text-foreground-500')}><span className="block mb-1">{index+1}</span>{label}</button></li>)}</ol>
    <div ref={section} tabIndex={-1} className="outline-none"><p className="ui-note">Стъпка {step+1} от 4</p><h2 className="mt-1 mb-6 font-heading text-xl font-semibold">{steps[step]}</h2></div>
    <fieldset disabled={busy} hidden={step !== 0}>
      <CityLocationFields id="nf" cities={cities} neighborhoods={neighborhoods} universities={universities} cityValue={draft.cityId} neighborhoodValue={draft.neighborhoodId} universityValues={draft.universityIds} keyMode="id" required multipleUniversities onCityChange={value => setDraft(old => ({...old, cityId:value, neighborhoodId:'', universityIds:[]}))} onNeighborhoodChange={value => update('neighborhoodId', value)} onUniversitiesChange={value => update('universityIds',value)} />
      <p className="ui-note mt-5">Публично се показват градът и кварталът. Не въвеждай точен адрес в описанието или върху снимките.</p>
    </fieldset>
    <fieldset disabled={busy} hidden={step !== 1} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">{input('title','Заглавие *',{maxLength:120,placeholder:'Например: Светло студио до университета'})}<div><label className="ui-label" htmlFor="nf-type">Тип жилище</label><select className="ui-field" id="nf-type" value={draft.type} onChange={event => update('type',event.target.value as ListingType)}>{types.map(type => <option value={type.value} key={type.value}>{type.label}</option>)}</select></div></div>
      <div><label htmlFor="nf-description" className="ui-label">Описание *</label><textarea id="nf-description" className="ui-field h-auto min-h-32 py-3" rows={4} minLength={30} maxLength={5000} value={draft.description} onChange={event => update('description',event.target.value)} placeholder="Разпределение, състояние, транспорт и условия. Без телефон или имейл." /><p className="ui-note mt-2">{draft.description.length}/5000 · минимум 30 знака</p></div>
      <div className="grid gap-4 sm:grid-cols-2">{input('price','Месечен наем (€) *',{type:'number',min:0.01,step:0.01,inputMode:'decimal'})}{input('area','Площ (m²) *',{type:'number',min:0.01,step:0.01,inputMode:'decimal'})}{input('rooms','Брой стаи *',{type:'number',min:1,max:100,step:1,inputMode:'numeric'})}{input('availableFrom','Свободно от *',{type:'date'})}</div>
      <div className="flex flex-wrap gap-3">{([['furnished','Обзаведено'],['pets','Домашни любимци'],['utilities','Разходите са включени']] as const).map(([key,label]) => <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-background-300 px-3 text-sm"><input type="checkbox" checked={draft[key]} onChange={event => update(key,event.target.checked)} />{label}</label>)}</div>
      <details className="rounded-lg border border-background-200 p-4" open={Boolean(issue && ['nf-floor','nf-total-floors','nf-deposit'].includes(issue.field)) || undefined}><summary className="font-medium text-sm">Етаж и депозит · по желание</summary><div className="mt-4 grid gap-4 sm:grid-cols-3">{input('floor','Етаж',{type:'number',min:-5,max:200,step:1})}{input('totalFloors','Етажи в сградата',{type:'number',min:1,max:200,step:1})}{input('deposit','Депозит (€)',{type:'number',min:0,step:0.01})}</div></details>
    </fieldset>
    <fieldset disabled={busy} hidden={step !== 2}><div id="nf-photos" tabIndex={-1}><PhotoPicker photos={photos} onChange={setPhotos} onProcessingChange={setPhotoBusy} disabled={busy} /></div><p className="ui-note mt-4">Първата снимка е корицата. Използвай реални снимки, без документи, контакти и лични данни.</p></fieldset>
    <fieldset disabled={busy} hidden={step !== 3}>
      <div className="rounded-lg bg-background-100 p-5"><p className="text-xs text-foreground-600">{city?.name}{hood ? ' · ' + hood.name : ''}</p><h3 className="mt-2 text-lg font-semibold break-words">{draft.title}</h3><p className="mt-3 font-semibold text-primary-800">{draft.price} € / месец · {draft.area} m² · {draft.rooms} стаи</p><p className="mt-3 whitespace-pre-wrap break-words text-sm text-foreground-700">{draft.description}</p><p className="ui-note mt-3">Свободно от: {draft.availableFrom} · Депозит: {draft.deposit === '' ? 'не е посочен' : draft.deposit + ' €'}</p>{uniNames.length > 0 && <p className="ui-note mt-3">Учебни локации: {uniNames.join('; ')}</p>}{photos[0] && <img src={photos[0].url} alt="Корична снимка на обявата" className="mt-4 aspect-video max-h-52 w-full rounded-lg object-cover" />}</div>
      <label className="mt-5 flex min-h-12 items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Описанието и снимките са на реалния имот и условията са точни. Обявата ще стане публична след преглед.</span></label><p className="ui-note mt-3">Телефонът и имейлът се показват само след вход. <Link to="/nastroyki" target="_blank" rel="noopener noreferrer" className="underline">Настройки на контакта (нов раздел)</Link></p>
    </fieldset>
    {error && <p role="alert" className="mt-5 rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm">{error}</p>}
    <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-background-200 pt-5">
      {step > 0 && !createdId && <button type="button" disabled={busy || photoBusy} onClick={() => move(step-1)} className="ui-secondary">Назад</button>}
      <button type="submit" disabled={busy || photoBusy} className="ui-button flex-1 sm:flex-none">{busy ? progress : createdId ? 'Към моите обяви' : step < 3 ? 'Продължи' : 'Изпрати за преглед'}</button>
      <button type="button" disabled={busy} onClick={onCancel} className="ml-auto px-2 text-sm text-foreground-600">Отказ</button>
    </div>
    <p className="ui-note mt-5">Квартали: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors, ODbL</a>. Каталогът може да е непълен.</p>
  </form>;
}
