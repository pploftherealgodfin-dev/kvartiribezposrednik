import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function UploadPage() {
  const { profile, retryProfile } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (profile?.role === 'owner' || profile?.role === 'admin') return <Navigate to="/panel/naemodatel?nova=1" replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!confirmed || busy) return;
    setBusy(true); setError('');
    try {
      const { error: issue } = await supabase.rpc('enable_owner_profile');
      if (issue) throw issue;
      retryProfile();
    } catch { setError('Профилът не е обновен. Опитай отново.'); }
    finally { setBusy(false); }
  };
  return <SiteLayout><div className="mx-auto max-w-2xl px-4 py-12"><h1 className="text-3xl font-bold">Публикувай собствен имот</h1><p className="mt-4 text-foreground-700">Можеш да търсиш жилище и да публикуваш от един акаунт. Всяка нова обява преминава през преглед, преди да стане публична.</p><form onSubmit={submit} className="mt-7 rounded-lg border border-background-200 p-6"><label className="flex items-start gap-3"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" /><span>Аз съм собственик или упълномощен наемодател и публикувам без брокерска комисиона. Приемам правилата за обяви и проверката на правото да отдавам имота.</span></label><button disabled={!confirmed || busy} className="mt-6 rounded-md bg-primary-600 px-5 py-3 font-semibold text-background-50 disabled:opacity-50">{busy ? 'Обновяване…' : 'Продължи към обявата'}</button>{error && <p role="alert" className="mt-4">{error}</p>}</form></div></SiteLayout>;
}
