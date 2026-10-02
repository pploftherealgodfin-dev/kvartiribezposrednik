import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { submitReport } from '@/lib/repository/reports';
function ReportForm() {
  const [receipt, setReceipt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (locked.current) return;
    const data = new FormData(event.currentTarget);
    locked.current = true; setBusy(true); setError('');
    try { setReceipt(await submitReport(null, String(data.get('reason')), String(data.get('details')), String(data.get('listing_url') || '') || null)); }
    catch { setError('Сигналът не е потвърден. Провери описанието, адреса и лимита от 5 сигнала за 24 часа. Данните остават във формата.'); }
    finally { locked.current = false; setBusy(false); }
  };
  if (receipt) return <div role="status" className="ui-panel mt-6"><p>Сигналът е записан за преглед.</p><p className="mt-2 break-all text-sm">Номер: {receipt}</p><Link className="mt-4 inline-block text-primary-700 underline" to="/moi-profil">Към профила</Link></div>;
  return <form className="mt-6" onSubmit={send}><fieldset disabled={busy} className="space-y-4">
    <label className="block">Причина<select name="reason" className="ui-field mt-1"><option value="fake">Съмнение за измама</option><option value="broker">Посредник или комисиона</option><option value="wrong_info">Подвеждаща информация</option><option value="rented">Вече отдаден имот</option><option value="other">Друго</option></select></label>
    <label className="block">Адрес на страницата<input name="listing_url" type="url" maxLength={1000} placeholder="https://kvartiribezposrednik.com/obiava/…" className="ui-field mt-1" /></label>
    <label className="block">Какво се случи?<textarea name="details" required minLength={10} maxLength={2000} rows={6} className="ui-field mt-1 h-auto py-3" /></label>
    <p className="ui-note">Не изпращай ЕГН, пароли или банкови данни. Самоличността ти не се показва публично. До 5 сигнала за 24 часа.</p>
    {error && <p role="alert" className="text-sm">{error}</p>}
    <button disabled={busy} className="ui-button">{busy ? 'Записване…' : 'Изпрати сигнал'}</button>
  </fieldset></form>;
}
export default function ReportContent() {
  const { user } = useAuth();
  return <SiteLayout><section className="mx-auto max-w-2xl px-4 py-12"><h1 className="text-3xl font-bold">Подай сигнал</h1><p className="mt-3">Опиши съмнителната обява или поведение. Сигналът влиза в модераторска опашка; подаването му не доказва нарушение.</p>{user ? <ReportForm key={user.id} /> : <p className="mt-6"><Link className="text-primary-700 underline" to="/vhod?next=%2Fdokladvane">Влез с потвърден профил</Link>, за да подадеш проследим сигнал.</p>}</section></SiteLayout>;
}
import '@/i18n/legal';
