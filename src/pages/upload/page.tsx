import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { repository } from '@/lib/repository';
import { dashboardPath } from '@/lib/roles';
import type { City, Neighborhood, University } from '@/lib/types';
import ListingForm from '@/pages/panel/owner/components/ListingForm';
export default function UploadPage() {
  const { profile, retryProfile } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [hoods, setHoods] = useState<Neighborhood[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const isOwner = profile?.role === 'owner' || profile?.role === 'admin';
  useEffect(() => {
    if (!isOwner) return;
    let active = true; setLoading(true); setError('');
    Promise.all([repository.getCities(),repository.getNeighborhoods(),repository.getUniversities()])
      .then(([a,b,c]) => { if(active) { setCities(a);setHoods(b);setUniversities(c); } })
      .catch(() => { if(active) setError('Локациите не се заредиха. Опитай отново.'); })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [isOwner,retry]);
  const enable = async (event: FormEvent) => {
    event.preventDefault(); if(!confirmed || busy) return;
    setBusy(true);setError('');
    try { const {error:issue} = await supabase.rpc('enable_owner_profile');if(issue)throw issue;retryProfile(); }
    catch { setError('Профилът не е обновен. Опитай отново.'); }
    finally { setBusy(false); }
  };
  return <SiteLayout><div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
    <h1 className="font-heading text-3xl font-semibold">{done ? 'Обявата е запазена за преглед' : 'Качи обява'}</h1>
    <p className="mt-3 text-sm leading-relaxed text-foreground-600">{done ? 'Ще се появи публично след одобрение. Следи статуса и снимките в „Моите обяви“.' : 'Реален имот, ясни условия и директен контакт. Без брокерска комисиона.'}</p>
    {done ? <div className="ui-panel mt-6"><i className="ri-checkbox-circle-line text-3xl text-primary-600" aria-hidden="true" /><div className="mt-5 flex flex-wrap gap-3"><Link to="/panel/naemodatel" className="ui-button">Моите обяви</Link><button className="ui-secondary" onClick={() => setDone(false)}>Още една обява</button></div></div>
      : !isOwner ? <form onSubmit={enable} className="ui-panel mt-6"><h2 className="text-lg font-semibold">Публикуване от същия акаунт</h2><p className="mt-2 text-sm text-foreground-600">Можеш едновременно да търсиш жилище и да отдаваш собствен имот.</p><label className="mt-5 flex min-h-12 items-start gap-3 text-sm leading-relaxed"><input className="mt-1" type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Аз съм собственик или упълномощен наемодател. Публикувам без комисиона и приемам проверката на правото да отдавам имота.</span></label><button disabled={!confirmed || busy} className="ui-button mt-5">{busy ? 'Подготвяме профила…' : 'Продължи'}</button>{error && <p role="alert" className="mt-4 text-sm">{error}</p>}</form>
      : loading ? <div role="status" className="ui-panel mt-6 animate-pulse">Подготвяме формата…</div>
      : error ? <div role="alert" className="ui-panel mt-6"><p>{error}</p><button className="ui-secondary mt-4" onClick={() => setRetry(value => value+1)}>Опитай отново</button></div>
      : <ListingForm ownerId={profile.id} cities={cities} neighborhoods={hoods} universities={universities} onCreated={() => {setDone(true);window.scrollTo({top:0,behavior:'instant'});}} onCancel={() => navigate(dashboardPath(profile.role))} />}
  </div></SiteLayout>;
}
