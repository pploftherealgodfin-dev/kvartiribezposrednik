import { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { submitReport } from '@/lib/repository/reports';
export default function ReportContent() {
  const { user } = useAuth();
  const [receipt, setReceipt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <SiteLayout><section className="mx-auto max-w-2xl px-4 py-12">
    <h1 className="text-3xl font-bold">Подай сигнал</h1>
    <p className="mt-3">Опиши съмнителната обява или поведение. Сигналът влиза в модераторска опашка; подаването му не доказва нарушение.</p>
    {!user ? <p className="mt-6"><Link className="underline" to="/vhod">Влез с потвърден профил</Link>, за да подадеш проследим сигнал.</p> : receipt ? <div role="status" className="mt-6 rounded border p-4"><p>Сигналът е записан за преглед.</p><p className="break-all">Номер: {receipt}</p><Link className="underline" to="/moi-profil">Към профила</Link></div> : <form className="mt-6 space-y-4" onSubmit={async event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('');
      try { setReceipt(await submitReport(null, String(data.get('reason')), String(data.get('details')), String(data.get('listing_url') || '') || null)); }
      catch (e) { setError((e as {message?:string}).message ?? 'Сигналът не е записан. Опитай отново.'); }
      finally { setBusy(false); }
    }}>
      <label className="block">Причина<select name="reason" className="mt-1 block w-full rounded border p-3"><option value="fake">Съмнение за измама</option><option value="broker">Посредник или комисиона</option><option value="wrong_info">Подвеждаща информация</option><option value="rented">Вече отдаден имот</option><option value="other">Друго</option></select></label>
      <label className="block">Адрес на страницата<input name="listing_url" type="url" maxLength={1000} placeholder="https://kvartiribezposrednik.com/obiava/…" className="mt-1 block w-full rounded border p-3" /></label>
      <label className="block">Какво се случи?<textarea name="details" required minLength={10} maxLength={2000} rows={6} className="mt-1 block w-full rounded border p-3" /></label>
      <p className="text-xs">Не изпращай ЕГН, пароли или банкови данни. Самоличността ти не се показва публично. До 5 сигнала за 24 часа.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="rounded bg-primary-700 px-5 py-3 text-white">{busy ? 'Записване…' : 'Изпрати сигнал'}</button>
    </form>}
  </section></SiteLayout>;
}
