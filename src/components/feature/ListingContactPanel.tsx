import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { revealContact, startConversation, type ListingContact } from '@/lib/repository/communication';
export default function ListingContactPanel({ listingId, slug, ownerId, active }: { listingId: string; slug: string; ownerId: string; active: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contact, setContact] = useState<ListingContact | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const scope = `${user?.id ?? ''}:${listingId}:${active}`;
  const currentScope = useRef(scope); currentScope.current = scope;
  const generation = useRef(0);
  const locked = useRef(false);
  const [contactScope, setContactScope] = useState('');
  useEffect(() => { const effectGeneration = ++generation.current; setContact(null); setContactScope(''); setError(''); setBusy(false); locked.current = false; return () => { generation.current = effectGeneration + 1; }; }, [scope]);
  const reveal = async () => {
    if (!user || !active || locked.current) return;
    locked.current = true;
    const request = generation.current;
    const valid = () => currentScope.current === scope && generation.current === request;
    setBusy(true); setError('');
    try { const result = await revealContact(listingId); if (!result) throw new Error('Няма достъпен контакт.'); if (valid()) { setContact(result); setContactScope(scope); } }
    catch { if (valid()) setError('Контактът не се зареди. Опитай отново или използвай съобщенията.'); }
    finally { if (valid()) { locked.current = false; setBusy(false); } }
  };
  const message = async () => {
    if (!user || !active || locked.current) return;
    locked.current = true;
    const request = generation.current;
    const valid = () => currentScope.current === scope && generation.current === request;
    setBusy(true); setError('');
    try { const id = await startConversation(listingId); if (valid()) navigate(`/saobshteniya?razgovor=${encodeURIComponent(id)}`); }
    catch { if (valid()) setError('Разговорът не може да се отвори. Провери дали обявата още е активна и опитай отново.'); }
    finally { if (valid()) { locked.current = false; setBusy(false); } }
  };
  if (!user) return <div className="mt-5 rounded-lg border border-primary-200 bg-primary-50 p-4"><h2 className="text-base font-bold">Контакт след вход</h2><p className="mt-2 text-sm text-foreground-700">Телефонът, имейлът и личните данни на наемодателя са достъпни само за влезли потребители.</p><Link to={`/vhod?next=${encodeURIComponent(`/obiava/${slug}`)}`} state={{ from: `/obiava/${slug}` }} className="mt-4 block rounded-md bg-primary-600 px-4 py-3 text-center font-semibold text-background-50">Влез, за да се свържеш</Link></div>;
  if (user.id === ownerId) return <Link to="/panel/naemodatel" className="mt-4 block text-primary-700 underline">Управлявай тази обява</Link>;
  return <div className="mt-5 space-y-3">{contact && contactScope === scope && active ? <section aria-label="Контакт с наемодателя" className="rounded-md bg-primary-50 p-4"><p className="font-bold">{contact.display_name}</p>{contact.phone && /^\+?[0-9]{8,15}$/.test(contact.phone) && <a className="mt-3 block rounded-md bg-primary-600 px-4 py-3 text-center font-semibold text-background-50" href={`tel:${contact.phone}`}>Обади се · {contact.phone}</a>}{contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && <a className="mt-3 block break-all text-primary-700 underline" href={`mailto:${contact.email}`}>{contact.email}</a>}{!contact.phone && <p className="mt-2 text-sm">Наемодателят няма потвърден телефон. Използвай съобщенията.</p>}</section> : <button type="button" disabled={busy || !active} onClick={reveal} className="w-full rounded-md border border-primary-600 px-4 py-3 font-semibold text-primary-700 disabled:opacity-50">{busy ? 'Зареждане…' : 'Покажи контактите'}</button>}<button type="button" disabled={busy || !active} onClick={message} className="w-full rounded-md bg-primary-600 px-4 py-3 font-semibold text-background-50 disabled:opacity-50">{active ? 'Пиши на наемодателя' : 'Обявата вече не е активна'}</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<p className="text-xs text-foreground-600">Пази кореспонденцията в платформата. Не изпращай банкови кодове и не плащай преди проверка и оглед.</p></div>;
}
