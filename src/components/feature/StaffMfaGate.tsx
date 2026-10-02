import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export default function StaffMfaGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setChecked(false);
    (async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      if (!active) return;
      if (data.currentLevel === 'aal2') { setReady(true); return; }
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;
      if (active) { setFactorId(factors.data.totp.find(f => f.status === 'verified')?.id ?? ''); setChecked(true); }
    })().catch(() => { if (active) setError('Защитеният вход не се провери. Опитай отново.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  if (loading) return <p className="p-8">Проверка на защитения вход…</p>;
  if (ready) return <>{children}</>;
  return <section className="mx-auto my-10 max-w-lg space-y-4 rounded-xl border p-6">
    <h1 className="text-xl font-bold">Защитен модераторски вход</h1>
    <p>Потвърди входа с приложение за еднократни кодове. Базата изисква тази проверка за модераторските действия.</p>
    {checked && !factorId && <button disabled={busy} className="rounded bg-primary-700 p-3 text-white" onClick={async () => {
      if (busy) return; setBusy(true); setError('');
      try {
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Модератор ${new Date().toISOString()}` });
        if (error) throw error;
        setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret);
      } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }}>Настрой двуфакторен вход</button>}
    {qr && <><img className="h-48 w-48" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`} alt="QR код за настройка на двуфакторен вход" /><p className="break-all text-sm">Ключ за ръчно въвеждане: <code>{secret}</code></p><p className="text-xs">Запази ключа в личен мениджър на пароли. Не го изпращай на други хора.</p></>}
    {factorId && <form className="space-y-3" onSubmit={async e => {
      e.preventDefault(); if (busy) return; setBusy(true); setError('');
      try {
        const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
        if (result.error) throw result.error;
        setQr(''); setSecret(''); setCode(''); setReady(true);
      } catch { setError('Кодът не е потвърден. Провери кода и връзката и опитай отново.'); }
      finally { setBusy(false); }
    }}>
      <label className="block">Шестцифрен код<input className="mt-1 block w-full rounded border p-3" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></label>
      <button disabled={busy} className="rounded bg-primary-700 p-3 text-white">Потвърди входа</button>
    </form>}
    {error && <div role="alert"><p className="text-red-700">{error}</p>{!checked && <button type="button" onClick={() => setRetry(value => value + 1)} className="ui-secondary mt-3">Провери входа отново</button>}</div>}
  </section>;
}
