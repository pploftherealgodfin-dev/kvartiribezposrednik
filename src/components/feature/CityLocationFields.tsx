import LocationSelect from './LocationSelect';
import type { City, Neighborhood, University } from '@/lib/types';
interface Props {
  id: string; cities: City[]; neighborhoods: Neighborhood[]; universities: University[];
  cityValue: string; neighborhoodValue: string; universityValues: string[];
  onCityChange: (value: string) => void; onNeighborhoodChange: (value: string) => void; onUniversitiesChange: (values: string[]) => void;
  keyMode?: 'id' | 'slug'; required?: boolean; multipleUniversities?: boolean; compact?: boolean;
}
export default function CityLocationFields({ id, cities, neighborhoods, universities, cityValue, neighborhoodValue, universityValues, onCityChange, onNeighborhoodChange, onUniversitiesChange, keyMode = 'slug', required = false, multipleUniversities = false, compact = false }: Props) {
  const key = (item: { id: string; slug: string }) => item[keyMode];
  const city = cities.find(item => key(item) === cityValue);
  const hoods = neighborhoods.filter(item => item.cityId === city?.id);
  const locations = universities.filter(item => item.cityId === city?.id);
  const selected = locations.filter(item => universityValues.includes(key(item)));
  return <div className={"grid min-w-0 gap-4" + (compact ? "" : " sm:grid-cols-2")}>
    <div className={city && !compact ? 'sm:col-span-2' : ''}><LocationSelect id={id + '-city'} label="Град" value={cityValue} placeholder={required ? 'Избери град' : 'Всички градове'} required={required} disabled={!cities.length}
      options={cities.map(item => ({ value: key(item), label: item.name + (item.region ? ' · ' + item.region : ''), priority: item.isUniversityCity }))} onChange={onCityChange} /></div>
    {city && <>
      <div><LocationSelect key={city.id + '-hood'} id={id + '-neighborhood'} label="Квартал · по желание" value={neighborhoodValue} placeholder={required ? 'Избери квартал, ако желаеш' : 'Всички квартали'} disabled={!hoods.length}
        options={hoods.map(item => ({ value: key(item), label: item.name + (item.associationMethod === 'nearest_town_approximate' ? ' · приблизителен район' : '') }))} onChange={onNeighborhoodChange} />
        {!hoods.length && <p className="ui-note mt-2">Можеш да продължиш само с града. Каталогът още няма квартали тук.</p>}</div>
      <div><LocationSelect key={city.id + '-uni'} id={id + '-university'} label="Университет / учебна локация · по желание" value={multipleUniversities ? '' : universityValues[0] ?? ''} placeholder={locations.length ? 'Университет, филиал или кампус' : 'Няма учебни локации в каталога'} disabled={!locations.length || (multipleUniversities && selected.length >= 3)}
        options={locations.filter(item => !multipleUniversities || !universityValues.includes(key(item))).map(item => ({ value: key(item), label: item.name }))}
        onChange={value => onUniversitiesChange(multipleUniversities ? value ? [...universityValues, value] : universityValues : value ? [value] : [])} />
        {multipleUniversities && selected.length > 0 && <ul aria-label="Избрани учебни локации" className="mt-2 space-y-2">{selected.map(item => <li key={item.id} className="flex items-center justify-between gap-2 rounded-md bg-primary-50 px-3 text-xs text-primary-800"><span>{item.name}</span><button type="button" aria-label={'Премахни ' + item.name} onClick={() => onUniversitiesChange(universityValues.filter(value => value !== key(item)))} className="shrink-0 px-2"><i className="ri-close-line" aria-hidden="true" /></button></li>)}</ul>}
      </div>
      {(selected.length > 0 || multipleUniversities) && locations.length > 0 && <p className={"ui-note" + (compact ? "" : " sm:col-span-2")}>{multipleUniversities ? 'До 3 учебни локации. ' : ''}Близостта е посочена от наемодателя; провери маршрута до твоя факултет или корпус.</p>}
    </>}
  </div>;
}
