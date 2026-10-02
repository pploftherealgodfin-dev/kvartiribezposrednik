import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { repository } from '@/lib/repository';
import { getCityContent } from './data';
import NotFound from '@/pages/NotFound';
import SiteLayout from '@/components/feature/SiteLayout';
export default function LocationPage() {
  const { grad, kvartal, universitet } = useParams();
  const city = getCityContent(grad);
  const [target, setTarget] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'missing' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!city || (!kvartal && !universitet)) return;
    let active = true;
    setTarget(null); setStatus('loading');
    Promise.all([repository.getCities(), kvartal ? repository.getNeighborhoods() : repository.getUniversities()]).then(([cities, areas]) => {
      if (!active) return;
      const cityId = cities.find(item => item.slug === city.slug)?.id;
      const area = areas.find(item => item.cityId === cityId && item.slug === (kvartal ?? universitet));
      if (area) setTarget(`/tarsene?grad=${encodeURIComponent(city.slug)}&${kvartal ? 'kvartal' : 'universitet'}=${encodeURIComponent(area.slug)}`);
      else setStatus('missing');
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [city, kvartal, universitet, retry]);
  if (!city || status === 'missing') return <NotFound />;
  if (!kvartal && !universitet) return <Navigate to={`/tarsene?grad=${city.slug}&tip=room`} replace />;
  if (target) return <Navigate to={target} replace />;
  return <SiteLayout><section className="mx-auto max-w-2xl px-4 py-16"><h1 className="text-2xl font-bold">Жилища {city.inPhrase}</h1><p role="status" className="mt-4">{status === 'error' ? 'Не успяхме да заредим тази локация.' : 'Зареждаме избраната локация…'}</p>{status === 'error' && <button className="mt-4 rounded-md bg-primary-600 px-5 py-3 text-background-50" onClick={() => setRetry(value => value + 1)}>Опитай отново</button>}<Link to={`/kvartiri-bez-posrednik/${city.slug}`} className="mt-6 block text-primary-700 underline">Всички жилища {city.inPhrase}</Link></section></SiteLayout>;
}
