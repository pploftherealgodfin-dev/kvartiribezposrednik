import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const field = 'mt-2 w-full rounded-md border border-background-300 bg-background-50 p-3';
export default function SettingsPage() {
  const { user, profile, retryProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) { setError('Въведи телефон с код на държавата, например +359888123456.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      if (!sent) {
        const { error: issue } = await supabase.auth.updateUser({ phone: normalized });
        if (issue) throw issue;
        setPhone(normalized); setSent(true); setNotice('Кодът е изпратен. Въведи го, за да потвърдиш телефона.');
      } else {
        const { error: issue } = await supabase.auth.verifyOtp({ phone: normalized, token: code.trim(), type: 'phone_change' });
        if (issue) throw issue;
        const { error: syncError } = await supabase.rpc('ensure_my_profile', { p_name: profile?.name ?? 'Потребител', p_role: 'tenant' });
        if (syncError) throw syncError;
        retryProfile(); setSent(false); setCode(''); setNotice('Телефонът е потвърден и запазен като контакт.');
      }
    } catch { setError(sent ? 'Кодът не е потвърден. Провери го и опитай отново.' : 'SMS не е изпратен. Опитай по-късно или използвай личните съобщения.'); }
    finally { setBusy(false); }
  };
  return <SiteLayout><div className="mx-auto max-w-2xl px-4 py-12"><h1 className="text-3xl font-bold">Контакт и настройки</h1><p className="mt-3 text-foreground-700">Контактите по твоя обява са достъпни след вход в потвърден акаунт. Телефонът се показва след SMS потвърждение; имейлът — след потвърждение от доставчика на вход.</p><dl className="mt-6 space-y-3 rounded-lg border p-5"><div><dt className="text-sm text-foreground-600">Профил</dt><dd>{profile?.name}</dd></div><div><dt className="text-sm text-foreground-600">Потвърден имейл</dt><dd>{user?.email_confirmed_at ? user.email : 'Няма потвърден имейл'}</dd></div><div><dt className="text-sm text-foreground-600">Потвърден телефон</dt><dd>{user?.phone_confirmed_at ? user.phone : 'Няма потвърден телефон'}</dd></div></dl><form onSubmit={submit} className="mt-8"><h2 className="text-xl font-bold">Добави или промени телефон</h2><label htmlFor="contact-phone" className="mt-4 block font-semibold">Телефон с код на държавата</label><input id="contact-phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={sent || busy} required placeholder="+359…" className={field} />{sent && <><label htmlFor="contact-code" className="mt-4 block font-semibold">Код от SMS</label><input id="contact-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={code} onChange={e => setCode(e.target.value)} required className={field} /><button type="button" onClick={() => { setSent(false); setCode(''); }} disabled={busy} className="mt-3 text-primary-700 underline">Използвай друг телефон / изпрати нов код</button></>}<button disabled={busy} className="mt-5 block rounded-md bg-primary-600 px-5 py-3 font-semibold text-background-50 disabled:opacity-50">{busy ? 'Обработка…' : sent ? 'Потвърди телефона' : 'Изпрати код'}</button>{notice && <p role="status" className="mt-4 text-primary-800">{notice}</p>}{error && <p role="alert" className="mt-4">{error}</p>}</form><Link to="/moi-profil" className="mt-8 inline-block text-primary-700 underline">Обратно към панела</Link></div></SiteLayout>;
}
