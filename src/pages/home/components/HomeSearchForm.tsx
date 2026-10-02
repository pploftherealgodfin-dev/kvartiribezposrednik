import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import CityLocationFields from '@/components/feature/CityLocationFields';
import type { City, Neighborhood, University } from '@/lib/types';
interface Props { cities: City[]; neighborhoods: Neighborhood[]; universities: University[] }
export default function HomeSearchForm({ cities, neighborhoods, universities }: Props) {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [hood, setHood] = useState('');
  const [universitiesSelected, setUniversitiesSelected] = useState<string[]>([]);
  const [type, setType] = useState('all');
  const [budget, setBudget] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if(city)params.set('grad',city);if(hood)params.set('kvartal',hood);if(universitiesSelected[0])params.set('universitet',universitiesSelected[0]);
    if(type!=='all')params.set('tip',type);if(budget)params.set('cena-do',budget);
    navigate('/tarsene' + (params.size ? '?' + params.toString() : ''));
  };
  return <form onSubmit={submit} className="ui-panel">
    <CityLocationFields id="home-search" cities={cities} neighborhoods={neighborhoods} universities={universities} cityValue={city} neighborhoodValue={hood} universityValues={universitiesSelected}
      onCityChange={value => {setCity(value);setHood('');setUniversitiesSelected([]);}} onNeighborhoodChange={setHood} onUniversitiesChange={setUniversitiesSelected} />
    <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:items-end"><div><label className="ui-label" htmlFor="home-search-type">Тип жилище</label><select id="home-search-type" className="ui-field" value={type} onChange={event => setType(event.target.value)}><option value="all">Всички типове</option><option value="apartment">Апартамент</option><option value="room">Стая</option><option value="studio">Студио</option><option value="house">Къща</option></select></div><div><label className="ui-label" htmlFor="home-search-budget">Бюджет до (€ / месец)</label><input id="home-search-budget" className="ui-field" type="number" min={0} step="0.01" inputMode="decimal" value={budget} onChange={event => setBudget(event.target.value)} placeholder="Без ограничение" /></div><button type="submit" className="ui-button sm:col-span-2"><i className="ri-search-line" aria-hidden="true" />Търси обяви</button></div>
    <p className="ui-note mt-4">Разглеждаш свободно. За контакт, любими и качване е нужен вход.</p>
  </form>;
}
