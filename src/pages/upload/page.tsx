import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { repository } from '@/lib/repository';
import { getCurrentOwnerListing, type EditableOwnerListing } from '@/lib/repository/owner';
import type { City, Neighborhood, University } from '@/lib/types';
const ListingForm = lazy(() => import('@/pages/panel/owner/components/ListingForm'));
const EditListingForm = lazy(() => import('@/pages/panel/owner/components/EditListingForm'));
function UploadContent() {
  const { profile, retryProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams(); const editId = params.get('redaktirai');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const enableLocked = useRef(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [existing, setExisting] = useState<EditableOwnerListing | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [hoods, setHoods] = useState<Neighborhood[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const isOwner = profile?.role === 'owner' || profile?.role === 'admin';
  const ownerId = profile?.id ?? '';
  useEffect(() => {
    if (!isOwner) return;
    let active = true; setLoading(true); setError('');
    const load = async () => {
      const current = await getCurrentOwnerListing(ownerId);
      if (!active) return;
      setExisting(current);
      if (current && editId !== current.id) return;
      if (editId && !current) throw new Error('missing');
      const [a,b,c] = await Promise.all([repository.getCities(),repository.getNeighborhoods(),repository.getUniversities()]);
      if (active) { setCities(a);setHoods(b);setUniversities(c); }
    };
    load().catch(() => { if(active) setError('Данните за публикуване не се заредиха. Опитай отново; не създавай втора обява.'); })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [isOwner,ownerId,editId,retry]);
  const enable = async (event: FormEvent) => {
    event.preventDefault(); if(!confirmed || busy || enableLocked.current) return;
    enableLocked.current = true;
    setBusy(true);setError('');
    try { const {error:issue} = await supabase.rpc('enable_owner_profile');if(issue)throw issue;retryProfile(); }
    catch { setError('Профилът не е обновен. Опитай отново.'); }
    finally { enableLocked.current = false; setBusy(false); }
  };
  return <SiteLayout><div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-700">Директен наем · една обява на акаунт</p>
    <h1 className="font-heading text-3xl font-semibold">{done ? 'Обявата е запазена за преглед' : editId && existing?.id === editId ? 'Редактирай обявата' : 'Качи обява'}</h1>
    <p className="mt-3 text-sm leading-relaxed text-foreground-600">{done ? 'Ще се появи публично след одобрение. Следи статуса и снимките в „Моите обяви“.' : 'Реален имот, ясни условия и директен контакт. Без брокерска комисиона.'}</p>
    {done ? <div role="status" className="ui-panel mt-6"><i className="ri-checkbox-circle-line text-3xl text-primary-600" aria-hidden="true" /><p className="mt-4 text-sm">Една обява, която поддържаш актуална. Променяй условията и снимките от панела си.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/panel/naemodatel" className="ui-button">Моите обяви</Link><Link to="/saveti/naemodatel-bez-agencia" className="ui-secondary">Наръчник за собственици</Link></div></div>
      : !isOwner ? <form onSubmit={enable} className="ui-panel mt-6"><h2 className="text-lg font-semibold">Публикуване от същия акаунт</h2><p className="mt-2 text-sm text-foreground-600">Можеш едновременно да търсиш жилище и да отдаваш един собствен имот.</p><label className="mt-5 flex min-h-12 items-start gap-3 text-sm leading-relaxed"><input className="mt-1" type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Аз съм собственик или упълномощен наемодател. Публикувам без комисиона и приемам прегледа на съдържанието.</span></label><p className="ui-note mt-3">Документната проверка не е условие за първата обява. Статусът за правото на отдаване се показва отделно.</p><button disabled={!confirmed || busy} className="ui-button mt-5">{busy ? 'Подготвяме профила…' : 'Продължи'}</button>{error && <p role="alert" className="mt-4 text-sm">{error}</p>}</form>
      : loading ? <div role="status" className="ui-panel mt-6 animate-pulse">Подготвяме формата…</div>
      : error ? <div role="alert" className="ui-panel mt-6"><p>{error}</p><button className="ui-secondary mt-4" onClick={() => setRetry(value => value+1)}>Опитай отново</button></div>
      : existing && (editId !== existing.id || ['flagged','removed'].includes(existing.status)) ? <section className="ui-panel mt-6"><p className="ui-note">Твоята обява</p><h2 className="mt-2 font-heading text-xl font-semibold">{existing.draft.title}</h2><p className="mt-3 text-sm leading-relaxed text-foreground-600">В пилотния режим всеки акаунт има една обява. Редактирай условията на същия имот, вместо да публикуваш дубликат.</p><div className="mt-5 flex flex-wrap gap-3">{existing.status !== 'flagged' && <Link className="ui-button" to={'/kachi-obiava?redaktirai=' + existing.id}>Редактирай обявата</Link>}<Link className="ui-secondary" to="/panel/naemodatel">Статус и снимки</Link>{existing.status === 'flagged' && <Link className="ui-secondary" to="/kontakti">Свържи се с екипа</Link>}</div></section>
      : <Suspense fallback={<div role="status" className="ui-panel mt-6">Подготвяме формата…</div>}>{existing ? <EditListingForm key={existing.id} listing={existing} cities={cities} neighborhoods={hoods} universities={universities} onSaved={() => {setDone(true);window.scrollTo({top:0,behavior:'instant'});}} onCancel={() => navigate('/panel/naemodatel')} /> : <ListingForm key={profile.id} ownerId={profile.id} cities={cities} neighborhoods={hoods} universities={universities} onCreated={() => {setDone(true);window.scrollTo({top:0,behavior:'instant'});}} onCancel={() => navigate('/panel/naemodatel')} />}</Suspense>}
  </div></SiteLayout>;
}
export default function UploadPage() {
  const { user, profile } = useAuth();
  return <UploadContent key={(user?.id ?? 'guest') + '|' + (profile?.role ?? '')} />;
}
