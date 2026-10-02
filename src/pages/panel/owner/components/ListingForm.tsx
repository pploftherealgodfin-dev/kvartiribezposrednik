import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addListingPhotos, createOwnerListing, type NewListingInput } from '@/lib/repository/owner';
import { uploadListingPhotos } from '@/lib/storage';
import type { City, ListingType, Neighborhood } from '@/lib/types';
import PhotoPicker, { type PickedPhoto } from './PhotoPicker';

interface ListingFormProps {
  ownerId: string;
  cities: City[];
  neighborhoods: Neighborhood[];
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
  const [cityId, setCityId] = useState(cities[0]?.id ?? '');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().slice(0, 10));
  const [furnished, setFurnished] = useState(true);
  const [pets, setPets] = useState(false);
  const [utilities, setUtilities] = useState(false);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [createdId, setCreatedId] = useState('');
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

    const input: NewListingInput = {
      title: title.trim(),
      description: description.trim(),
      type,
      priceEur: priceValue,
      areaM2: areaValue,
      rooms: roomsValue,
      cityId,
      neighborhoodId: neighborhoodId || null,
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
      const created = await createOwnerListing(ownerId, input);
      if (photos.length > 0) {
        try {
          const urls = await uploadListingPhotos(photos.map((photo) => photo.file), ownerId, created.id);
          await addListingPhotos(created.id, urls);
        } catch {
          setError('Обявата е създадена, но снимките не са записани. Затвори формата и ги добави от панела.');
          setCreatedId(created.id);
          return;
        }
      }
      onCreated();
    } catch {
      setError(t('common.error'));
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
    >
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
            maxLength={2000} minLength={30} required
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
            min={0}
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
            min={0}
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
            min={1}
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
            min={0}
            value={deposit}
            onChange={(event) => setDeposit(event.target.value)}
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-city">
            {t('owner.form.city')}
          </label>
          <select
            id="nf-city"
            value={cityId}
            onChange={(event) => {
              setCityId(event.target.value);
              setNeighborhoodId('');
            }}
            className={fieldCls}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="nf-neighborhood">
            {t('owner.form.neighborhood')}
          </label>
          <select
            id="nf-neighborhood"
            value={neighborhoodId}
            onChange={(event) => setNeighborhoodId(event.target.value)}
            className={fieldCls}
          >
            <option value="">—</option>
            {cityNeighborhoods.map((hood) => (
              <option key={hood.id} value={hood.id}>
                {hood.name}
              </option>
            ))}
          </select>
        </div>

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
    </form>
  );
}