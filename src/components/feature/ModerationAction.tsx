import { useRef, useState } from 'react';

/** Every privileged action asks the operator for an auditable reason. */
export default function ModerationAction({ label, onConfirm, verification = false }: {
  label: string;
  onConfirm: (reason: string, method: string) => Promise<void>;
  verification?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('in_person');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  return <div className="max-w-md">
    <button type="button" disabled={busy} onClick={() => setOpen(!open)} className="rounded-md border border-background-300 px-3 py-2 text-sm">{label}</button>
    {open && <form className="mt-2 space-y-2 rounded-md border border-background-300 p-3" onSubmit={async event => {
      event.preventDefault(); if (locked.current) return;
      if (reason.trim().length < 10) { setError('Опиши причината с поне 10 знака.'); return; }
      locked.current = true; setBusy(true); setError('');
      try { await onConfirm(reason.trim(), method); setOpen(false); setReason(''); }
      catch (e) { setError(e instanceof Error ? e.message : (e as {message?: string})?.message ?? 'Операцията не е изпълнена.'); }
      finally { locked.current = false; setBusy(false); }
    }}>
      {verification && <>
        <p className="text-xs">Потвърди само лично извършена проверка на правото за отдаване на този имот. Не включвай ЕГН или копие на документ в бележката.</p>
        <select disabled={busy} aria-label="Метод на проверката" value={method} onChange={e => setMethod(e.target.value)} className="w-full rounded border p-2">
          <option value="in_person">Проверка на място</option><option value="document_review">Преглед на доказателства</option>
        </select>
      </>}
      <label className="block text-sm">{verification ? 'Референция към проверката' : 'Причина за решението'}
        <textarea disabled={busy} required minLength={10} maxLength={verification ? 500 : 1000} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full rounded border p-2" />
      </label>
      {verification && <label className="flex gap-2 text-xs"><input type="checkbox" required />Проверих правото за отдаване за конкретния имот.</label>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="rounded bg-primary-700 px-3 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Записване…' : 'Потвърди решението'}</button>
    </form>}
  </div>;
}
