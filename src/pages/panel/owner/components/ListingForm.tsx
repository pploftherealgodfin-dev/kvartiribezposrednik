import LocationSelect from '@/components/feature/LocationSelect';
import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addListingPhotos, createOwnerListing, type NewListingInput } from '@/lib/repository/owner';
import { uploadListingPhotos } from '@/lib/storage';
import type { City, ListingType, Neighborhood, University } from '@/lib/types';
import PhotoPicker, { type PickedPhoto } from './PhotoPicker';

interface ListingFormProps {
  ownerId: string;
  cities: City[];
  neighborhoods: Neighborhood[];
  universities: University[];
  onCreated: () => void;
  onCancel: () => void;
}

const fieldCls =
  'mt-1.5 w-full rounded-md border border-background-300 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 transition-colors placeholder:text-foreground-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400/40';
const labelCls = 'block text-sm font-semibold text-foreground-900';

const TYPES: ListingType[] = ['apartment', 'room', 'studio', 'house'];

export default function ListingForm({
  ownerId,
  cities,
  neighborhoods,
  universities,
  onCreated,
  onCancel,
}: ListingFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ListingType>('apartment');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('1');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [deposit, setDeposit] = useState('');
  const [cityId, setCityId] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [universityIds, setUniversityIds] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().slice(0, 10));
  const [furnished, setFurnished] = useState(true);
  const [pets, setPets] = useState(false);
  const [utilities, setUtilities] = useState(false);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [createdId, setCreatedId] = useState('');
  const requestId = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cityNeighborhoods = neighborhoods.filter((item) => item.cityId === cityId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (createdId) { onCreated(); return; }

    const priceValue = Number(price);
    const areaValue = Number(area);
    const roomsValue = Number(rooms);

    if (
      title.trim().length < 5 || description.trim().length < 30 ||
      !title.trim() ||
      !cityId ||
      !availableFrom ||
      !(priceValue > 0) ||
      !(areaValue > 0) ||
      !(roomsValue > 0)
    ) {
      setError(t('owner.form.required'));
      return;
    }

    if (photos.length === 0) { setError('Добави поне една реална снимка на жилището.'); return; }
    if (!Number.isInteger(roomsValue) || roomsValue > 100 || (deposit && !(Number(deposit) >= 0)) || (floor && (!Number.isInteger(Number(floor)) || Number(floor) < -5 || Number(floor) > 200)) || (totalFloors && (!Number.isInteger(Number(totalFloors)) || Number(totalFloors) < 1 || Number(totalFloors) > 200 || (floor && Number(floor) > Number(totalFloors))))) { setError('Провери стаите, етажа, общия брой етажи и депозита.'); return; }
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(title + ' ' + description) || /(\+?359|00359|0)[ -]?[0-9]([ ()-]*[0-9]){7,8}/.test(title + ' ' + description)) { setError('Премахни телефона и имейла от публичния текст. Контактите се показват защитено след вход.'); return; }
    const input: NewListingInput = {
      title: title.trim(),
      description: description.trim(),
      type,
      priceEur: priceValue,
      areaM2: areaValue,
      rooms: roomsValue,
      cityId,
      neighborhoodId: neighborhoodId || null,
      nearbyUniversityIds: universityIds,
      availableFrom,
      deposit: deposit ? Number(deposit) : null,
      floor: floor ? Number(floor) : null,
      totalFloors: totalFloors ? Number(totalFloors) : null,
      furnished,
      petsAllowed: pets,
      utilitiesIncluded: utilities,
    };

    setBusy(true);
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const created = await createOwnerListing(ownerId, input, requestId.current);
      if (photos.length > 0) {
        try {
          const urls = await uploadListingPhotos(photos.map((photo) => photo.file), ownerId, created.id);
          await addListingPhotos(created.id, urls);
        } catch {
          setError('Обявата е създадена, но записът на снимките не е потвърден. Затвори формата и ги провери в панела.');
          setCreatedId(created.id);
          return;
        }
      }
      onCreated();
    } catch (issue) {
      if (issue instanceof Error && issue.message.startsWith('Тази обява вече е записана')) { setError(issue.message); return; }
      setError('Записът на обявата не е потвърден. Провери връзката и данните. Ако имаш грешка за лимит или роля, свържи се с екипа.');
    } finally {
      setBusy(false);
    }
  };

  const checkboxCls =
    'flex cursor-pointer items-center gap-2.5 rounded-md border border-background-300 px-3.5 py-2.5 text-sm font-medium text-foreground-800 transition-colors hover:border-primary-300';

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-background-200 bg-background-100 p-5 md:p-6"
      aria-busy={busy}
    >
      <p className="mb-4 text-sm text-foreground-600">Попълни локацията, цената и условията. Добави реални снимки, без телефони, документи или точен адрес върху тях. Контактът се настройва отделно и е защитен с вход.</p>
      <h2 className="font-heading text-lg font-extrabold text-foreground-950">
        {t('owner.form.title')}
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="nf-title">
            {t('owner.form.listingTitle')}
          </label>
          <input
            id="nf-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldCls}
            maxLength={120} minLength={5} required
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="nf-description">
            {t('owner.form.description')}
          </label>
          <textarea
            id="nf-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={5000} minLength={30} required
            className={`${fieldCls} resize-y`}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-type">
            {t('owner.form.type')}
          </label>
          <select
            id="nf-type"
            value={type}
            onChange={(event) => setType(event.target.value as ListingType)}
            className={fieldCls}
          >
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {t(`type.${item}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-price">
            {t('owner.form.price')}
          </label>
          <input
            id="nf-price"
            type="number"
            min={0.01} step="0.01" required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-area">
            {t('owner.form.area')}
          </label>
          <input
            id="nf-area"
            type="number"
            min={0.01} step="0.01" required
            value={area}
            onChange={(event) => setArea(event.target.value)}
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-rooms">
            {t('owner.form.rooms')}
          </label>
          <input
            id="nf-rooms"
            type="number"
            min={1} max={100} step={1} required
            value={rooms}
            onChange={(event) => setRooms(event.target.value)}
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-floor">
            {t('owner.form.floor')}
          </label>
          <input
            id="nf-floor"
            type="number"
            min={-5} max={200} step={1}
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-total-floors">
            {t('owner.form.totalFloors')}
          </label>
          <input
            id="nf-total-floors"
            type="number"
            min={1} max={200} step={1}
            value={totalFloors}
            onChange={(event) => setTotalFloors(event.target.value)}
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-deposit">
            {t('owner.form.deposit')}
          </label>
          <input
            id="nf-deposit"
            type="number"
            min={0} step="0.01"
            value={deposit}
            onChange={(event) => setDeposit(event.target.value)}
            className={fieldCls}
          />
        </div>

        <LocationSelect id="nf-city" label={t('owner.form.city')} value={cityId} required placeholder="Избери град" options={cities.map(city => ({ value: city.id, label: `${city.name}${city.region ? ` · ${city.region}` : ''}`, priority: city.isUniversityCity }))} onChange={value => { setCityId(value); setNeighborhoodId(''); setUniversityIds([]); }} />
        <LocationSelect key={"nf-neighborhood-" + cityId} id="nf-neighborhood" label={t('owner.form.neighborhood')} value={neighborhoodId} placeholder={cityId ? 'Избери квартал (по избор)' : 'Избери град първо'} options={cityNeighborhoods.map(item => ({ value: item.id, label: item.name + (item.associationMethod === 'nearest_town_approximate' ? ' · приблизителен район' : '') }))} disabled={!cityId} onChange={setNeighborhoodId} />
        {cityId && !cityNeighborhoods.length && <p className="text-sm text-foreground-600 md:col-span-2">Каталогът няма потвърдени квартали за този град. Можеш да публикуваш на ниво град. За добавяне на квартал пиши чрез „Контакти“.</p>}
        {universities.some(item => item.cityId === cityId) && <fieldset className="rounded-lg border border-background-300 p-4 md:col-span-2"><legend className="px-2 font-semibold">Университети наблизо (по избор, до 3)</legend><p className="mb-3 text-xs text-foreground-600">Посочи само достъпни от жилището университети. Това е твоя оценка за близост, а не измерено разстояние.</p><div className="max-h-48 space-y-2 overflow-y-auto">{universities.filter(item => item.cityId === cityId).map(item => <label key={item.id} className="flex gap-3 text-sm"><input type="checkbox" checked={universityIds.includes(item.id)} disabled={!universityIds.includes(item.id) && universityIds.length >= 3} onChange={e => setUniversityIds(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id))} />{item.name}</label>)}</div></fieldset>}
        <div>
          <label className={labelCls} htmlFor="nf-available">
            {t('owner.form.availableFrom')}
          </label>
          <input
            id="nf-available"
            type="date"
            value={availableFrom}
            onChange={(event) => setAvailableFrom(event.target.value)}
            className={fieldCls}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <label className={checkboxCls}>
            <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
            {t('owner.form.furnished')}
          </label>
          <label className={checkboxCls}>
            <input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} />
            {t('owner.form.pets')}
          </label>
          <label className={checkboxCls}>
            <input type="checkbox" checked={utilities} onChange={(e) => setUtilities(e.target.checked)} />
            {t('owner.form.utilities')}
          </label>
        </div>

        <div className="md:col-span-2">
          <span className={labelCls}>{t('owner.form.photos')}</span>
          <div className="mt-1.5">
            <PhotoPicker photos={photos} onChange={setPhotos} disabled={busy} />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-background-300 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={busy ? 'ri-loader-4-line animate-spin text-base' : 'ri-add-line text-base'} aria-hidden="true" />
          {t('owner.form.submit')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-background-300 px-5 py-2.5 text-sm font-semibold text-foreground-700 transition-colors hover:bg-background-50"
        >
          {t('owner.form.cancel')}
        </button>
      </div>
    <p className="mt-5 text-xs text-foreground-600">Квартали: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors, ODbL</a>. Каталогът може да е непълен; <a href="/kontakti" className="underline">предложи корекция</a>.</p>
</form>
  );
}