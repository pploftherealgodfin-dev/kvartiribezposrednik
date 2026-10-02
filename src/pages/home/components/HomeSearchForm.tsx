import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import CityLocationFields from '@/components/feature/CityLocationFields';
import { repository } from '@/lib/repository';
import type { City, Neighborhood, University } from '@/lib/types';
interface Props { cities: City[] }
export default function HomeSearchForm({ cities }: Props) {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [hood, setHood] = useState('');
  const [universitiesSelected, setUniversitiesSelected] = useState<string[]>([]);
  const [type, setType] = useState('all');
  const [budget, setBudget] = useState('');
  const [details, setDetails] = useState<{ cityId: string; neighborhoods: Neighborhood[]; universities: University[]; loading: boolean; error: boolean }>({ cityId: '', neighborhoods: [], universities: [], loading: false, error: false });
  const [retry, setRetry] = useState(0);
  const cityId = cities.find(item => item.slug === city)?.id ?? '';
  const current = details.cityId === cityId ? details : { cityId, neighborhoods: [], universities: [], loading: Boolean(cityId), error: false };
  useEffect(() => {
    if (!cityId) return;
    let active = true;
    setDetails({ cityId, neighborhoods: [], universities: [], loading: true, error: false });
    Promise.all([repository.getNeighborhoods(cityId), repository.getUniversities(cityId)])
      .then(([neighborhoods, universities]) => { if (active) setDetails({ cityId, neighborhoods, universities, loading: false, error: false }); })
      .catch(() => { if (active) setDetails({ cityId, neighborhoods: [], universities: [], loading: false, error: true }); });
    return () => { active = false; };
  }, [cityId, retry]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if(city)params.set('grad',city);if(hood)params.set('kvartal',hood);if(universitiesSelected[0])params.set('universitet',universitiesSelected[0]);
    if(type!=='all')params.set('tip',type);if(budget)params.set('cena-do',budget);
    navigate('/tarsene' + (params.size ? '?' + params.toString() : ''));
  };
  return <form onSubmit={submit} className="ui-panel">
    <CityLocationFields id="home-search" cities={cities} neighborhoods={current.neighborhoods} universities={current.universities} locationsLoading={current.loading} locationsError={current.error} cityValue={city} neighborhoodValue={hood} universityValues={universitiesSelected}
      onCityChange={value => {setCity(value);setHood('');setUniversitiesSelected([]);}} onNeighborhoodChange={setHood} onUniversitiesChange={setUniversitiesSelected} />
    {current.loading && <p role="status" className="ui-note mt-3">Зареждаме кварталите и университетите…</p>}
    {current.error && <p role="alert" className="mt-3 text-sm">Локациите не се заредиха. Можеш да търсиш само с града. <button type="button" className="min-h-11 text-primary-700 underline" onClick={() => setRetry(value => value + 1)}>Опитай отново</button></p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:items-end"><div><label className="ui-label" htmlFor="home-search-type">Тип жилище</label><select id="home-search-type" className="ui-field" value={type} onChange={event => setType(event.target.value)}><option value="all">Всички типове</option><option value="apartment">Апартамент</option><option value="room">Стая</option><option value="studio">Студио</option><option value="house">Къща</option></select></div><div><label className="ui-label" htmlFor="home-search-budget">Бюджет до (€ / месец)</label><input id="home-search-budget" className="ui-field" type="number" min={0} step="0.01" inputMode="decimal" value={budget} onChange={event => setBudget(event.target.value)} placeholder="Без ограничение" /></div><button type="submit" className="ui-button sm:col-span-2"><i className="ri-search-line" aria-hidden="true" />Търси обяви</button></div>
    <p className="ui-note mt-4">Разглеждаш свободно. За контакт, любими и качване е нужен вход.</p>
  </form>;
}
