import { useTranslation } from 'react-i18next';
import type { City, Neighborhood, University } from '@/lib/types';

export interface SearchFilterValues {
  citySlug: string;
  neighborhoodSlug: string;
  universitySlug: string;
  type: string;
  /** Стаи, разделени със запетая; „4+“ значи 4 или повече. */
  rooms: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  floorMin: string;
  floorMax: string;
  furnished: string;
  pets: string;
  availableFrom: string;
  text: string;
}

interface SearchFiltersProps {
  cities: City[];
  neighborhoods: Neighborhood[];
  universities: University[];
  values: SearchFilterValues;
  onChange: (field: keyof SearchFilterValues, value: string) => void;
  onReset: () => void;
}

const ROOM_OPTIONS = ['1', '2', '3', '4+'];

const fieldCls =
  'h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100';
const labelCls = 'mb-1.5 block text-xs font-semibold text-foreground-700';

function toggleRoom(current: string, option: string): string {
  const set = new Set(current ? current.split(',').filter(Boolean) : []);
  if (set.has(option)) set.delete(option);
  else set.add(option);
  return Array.from(set)
    .sort((a, b) => (a === '4+' ? 99 : Number(a)) - (b === '4+' ? 99 : Number(b)))
    .join(',');
}

export default function SearchFilters({
  cities,
  neighborhoods,
  universities,
  values,
  onChange,
  onReset,
}: SearchFiltersProps) {
  const { t } = useTranslation();

  const selectedCity = cities.find((city) => city.slug === values.citySlug);
  const visibleNeighborhoods = selectedCity
    ? neighborhoods.filter((hood) => hood.cityId === selectedCity.id)
    : neighborhoods;
  const selectedRooms = values.rooms ? values.rooms.split(',') : [];

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-extrabold text-foreground-950">
          {t('search.filters')}
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground-600 transition-colors hover:text-primary-700"
        >
          <i className="ri-refresh-line text-sm" aria-hidden="true" />
          {t('search.reset')}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className={labelCls} htmlFor="f-keyword">
            {t('search.keyword')}
          </label>
          <input
            id="f-keyword"
            type="search"
            className={fieldCls}
            placeholder={t('search.keywordPlaceholder')}
            value={values.text}
            onChange={(event) => onChange('text', event.target.value)}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="f-city">
            {t('search.city')}
          </label>
          <select
            id="f-city"
            className={fieldCls}
            value={values.citySlug}
            onChange={(event) => {
              onChange('citySlug', event.target.value);
              onChange('neighborhoodSlug', '');
            }}
          >
            <option value="">{t('search.allCities')}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="f-neighborhood">
            {t('search.neighborhood')}
          </label>
          <select
            id="f-neighborhood"
            className={fieldCls}
            value={values.neighborhoodSlug}
            onChange={(event) => onChange('neighborhoodSlug', event.target.value)}
          >
            <option value="">{t('search.allNeighborhoods')}</option>
            {visibleNeighborhoods.map((hood) => (
              <option key={hood.id} value={hood.slug}>
                {hood.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="f-university">
            {t('search.university')}
          </label>
          <select
            id="f-university"
            className={fieldCls}
            value={values.universitySlug}
            onChange={(event) => onChange('universitySlug', event.target.value)}
          >
            <option value="">{t('search.allUniversities')}</option>
            {universities.map((university) => (
              <option key={university.id} value={university.slug}>
                {university.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="f-type">
            {t('search.type')}
          </label>
          <select
            id="f-type"
            className={fieldCls}
            value={values.type}
            onChange={(event) => onChange('type', event.target.value)}
          >
            <option value="all">{t('type.all')}</option>
            <option value="apartment">{t('type.apartment')}</option>
            <option value="room">{t('type.room')}</option>
            <option value="studio">{t('type.studio')}</option>
            <option value="house">{t('type.house')}</option>
          </select>
        </div>

        <div>
          <span className={labelCls}>{t('search.price')}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              className={fieldCls}
              placeholder={t('search.from')}
              aria-label={`${t('search.price')} ${t('search.from')}`}
              value={values.priceMin}
              onChange={(event) => onChange('priceMin', event.target.value)}
            />
            <span className="text-foreground-400">—</span>
            <input
              type="number"
              min={0}
              className={fieldCls}
              placeholder={t('search.to')}
              aria-label={`${t('search.price')} ${t('search.to')}`}
              value={values.priceMax}
              onChange={(event) => onChange('priceMax', event.target.value)}
            />
          </div>
        </div>

        <div>
          <span className={labelCls}>{t('search.rooms')}</span>
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map((option) => {
              const active = selectedRooms.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange('rooms', toggleRoom(values.rooms, option))}
                  className={`h-10 min-w-[46px] cursor-pointer whitespace-nowrap rounded-md border px-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-primary-500 bg-primary-500 text-background-50'
                      : 'border-background-300 bg-background-50 text-foreground-800 hover:border-primary-300'
                  }`}
                >
                  {option === '4+' ? t('search.rooms4plus') : option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className={labelCls}>{t('search.area')}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              className={fieldCls}
              placeholder={t('search.from')}
              aria-label={`${t('search.area')} ${t('search.from')}`}
              value={values.areaMin}
              onChange={(event) => onChange('areaMin', event.target.value)}
            />
            <span className="text-foreground-400">—</span>
            <input
              type="number"
              min={0}
              className={fieldCls}
              placeholder={t('search.to')}
              aria-label={`${t('search.area')} ${t('search.to')}`}
              value={values.areaMax}
              onChange={(event) => onChange('areaMax', event.target.value)}
            />
          </div>
        </div>

        <div>
          <span className={labelCls}>{t('search.floor')}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={fieldCls}
              placeholder={t('search.from')}
              aria-label={`${t('search.floor')} ${t('search.from')}`}
              value={values.floorMin}
              onChange={(event) => onChange('floorMin', event.target.value)}
            />
            <span className="text-foreground-400">—</span>
            <input
              type="number"
              className={fieldCls}
              placeholder={t('search.to')}
              aria-label={`${t('search.floor')} ${t('search.to')}`}
              value={values.floorMax}
              onChange={(event) => onChange('floorMax', event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="f-furnished">
            {t('search.furnished')}
          </label>
          <select
            id="f-furnished"
            className={fieldCls}
            value={values.furnished}
            onChange={(event) => onChange('furnished', event.target.value)}
          >
            <option value="">{t('search.furnishedAny')}</option>
            <option value="1">{t('search.furnishedYes')}</option>
            <option value="0">{t('search.furnishedNo')}</option>
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="f-pets">
            {t('search.pets')}
          </label>
          <select
            id="f-pets"
            className={fieldCls}
            value={values.pets}
            onChange={(event) => onChange('pets', event.target.value)}
          >
            <option value="">{t('search.petsAny')}</option>
            <option value="1">{t('search.petsYes')}</option>
            <option value="0">{t('search.petsNo')}</option>
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="f-available">
            {t('search.availableFrom')}
          </label>
          <input
            id="f-available"
            type="date"
            className={fieldCls}
            value={values.availableFrom}
            onChange={(event) => onChange('availableFrom', event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}