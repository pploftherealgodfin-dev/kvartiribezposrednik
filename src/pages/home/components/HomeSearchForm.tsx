import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocationSelect from '@/components/feature/LocationSelect';
import type { City } from '@/lib/types';

interface HomeSearchFormProps {
  cities: City[];
}

const ROOM_OPTIONS = ['1', '2', '3', '4+'];

export default function HomeSearchForm({ cities }: HomeSearchFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [citySlug, setCitySlug] = useState('');
  const [area, setArea] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [rooms, setRooms] = useState('');
  const [type, setType] = useState('all');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (citySlug) params.set('grad', citySlug);
    if (area.trim()) params.set('t', area.trim());
    if (priceMin) params.set('cena-ot', priceMin);
    if (priceMax) params.set('cena-do', priceMax);
    if (rooms) params.set('stai', rooms);
    if (type && type !== 'all') params.set('tip', type);
    const query = params.toString();
    navigate(query ? `/tarsene?${query}` : '/tarsene');
  };

  const fieldClass =
    'h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground-600';

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-lg border border-background-200/70 bg-background-50 p-4 md:p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <div className="lg:col-span-2">
          <LocationSelect id="home-search-city" label={t('home.searchCity')} value={citySlug} options={cities.map(city => ({ value: city.slug, label: `${city.name}${city.region ? ` · ${city.region}` : ''}`, priority: city.isUniversityCity }))} placeholder="Всички градове" onChange={setCitySlug} />
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className={labelClass} htmlFor="home-search-area">
            {t('home.searchArea')}
          </label>
          <input
            id="home-search-area"
            type="text" maxLength={200}
            className={fieldClass}
            placeholder={t('home.areaPlaceholder')}
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="home-search-type">
            {t('home.type')}
          </label>
          <select
            id="home-search-type"
            className={fieldClass}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">{t('type.all')}</option>
            <option value="apartment">{t('type.apartment')}</option>
            <option value="room">{t('type.room')}</option>
            <option value="studio">{t('type.studio')}</option>
            <option value="house">{t('type.house')}</option>
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="home-search-rooms">
            {t('home.rooms')}
          </label>
          <select
            id="home-search-rooms"
            className={fieldClass}
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
          >
            <option value="">{t('home.rooms')}</option>
            {ROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="home-search-price-min">
            {t('home.priceFrom')} (€)
          </label>
          <input
            id="home-search-price-min"
            type="number"
            min={0}
            className={fieldClass}
            placeholder="0"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-[200px]">
          <label className={labelClass} htmlFor="home-search-price-max">
            {t('home.priceTo')} (€)
          </label>
          <input
            id="home-search-price-max"
            type="number"
            min={0}
            className={fieldClass}
            placeholder="0"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-6 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 sm:w-auto"
        >
          <i className="ri-search-line text-lg" />
          {t('home.searchButton')}
        </button>
      </div>
    </form>
  );
}