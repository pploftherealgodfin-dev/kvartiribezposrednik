import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { getThreads, getThread, getThreadMessages, sendMessage, type Thread, type ThreadMessage } from '@/lib/repository/communication';

function mergeMessages(old: ThreadMessage[], incoming: ThreadMessage[]) {
  return [...new Map([...old, ...incoming].map(item => [item.id, item])).values()].sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}
function mergeThreads(old: Thread[], incoming: Thread[]) {
  return [...new Map([...old,...incoming].map(item => [item.id,item])).values()].sort((a,b) => b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id));
}
export default function MessagesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const selected = params.get('razgovor') ?? '';
  const currentThread = useRef(selected); currentThread.current = selected;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadOffset, setThreadOffset] = useState(100);
  const [moreThreads, setMoreThreads] = useState(false);
  const [moreMessages, setMoreMessages] = useState(false);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const request = useRef({ id: '', body: '', thread: '' });
  const refresh = useCallback(async () => { const rows = await getThreads(); setThreads(old => mergeThreads(old,rows)); }, []);
  useEffect(() => {
    let live = true; setLoading(true); setError('');
    getThreads().then(rows => { if (live) { setThreads(rows); setThreadOffset(100); setMoreThreads(rows.length === 100); } })
      .catch(() => { if (live) setError('Разговорите не се заредиха.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [retry]);
  useEffect(() => {
    let live = true; setMessages([]); setBody(''); setMoreMessages(false); setError('');
    if (!selected) return;
    const load = (initial = false) => getThreadMessages(selected).then(rows => { if (live) { setMessages(old => mergeMessages(old,rows)); if (initial) setMoreMessages(rows.length === 100); } }).catch(() => { if (live) setError('Съобщенията не се заредиха. Опитай отново.'); });
    void getThread(selected).then(item => { if (live && item) setThreads(old => mergeThreads(old,[item])); }).catch(() => { if (live) setError('Разговорът не се зареди.'); });
    void load(true);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') { void load(); void refresh().catch(() => undefined); } }, 15000);
    return () => { live = false; window.clearInterval(timer); };
  }, [selected, refresh, retry]);
  const older = async () => {
    if (!messages.length || historyLoading) return;
    const threadId = selected; setHistoryLoading(true);
    try { const rows = await getThreadMessages(threadId,messages[0]); if (currentThread.current === threadId) { setMessages(old => mergeMessages(old,rows)); setMoreMessages(rows.length === 100); } }
    catch { setError('По-старите съобщения не се заредиха. Опитай отново.'); }
    finally { setHistoryLoading(false); }
  };
  const loadThreads = async () => {
    if (threadsLoading) return; setThreadsLoading(true);
    try { const rows = await getThreads(threadOffset); setThreads(old => mergeThreads(old,rows)); setThreadOffset(value => value + 100); setMoreThreads(rows.length === 100); }
    catch { setError('Още разговори не се заредиха. Опитай отново.'); }
    finally { setThreadsLoading(false); }
  };
  const send = async (event: FormEvent) => {
    event.preventDefault(); if (!body.trim() || busy) return;
    const text = body.trim(); const threadId = selected; setBusy(true); setError('');
    if (request.current.body !== text || request.current.thread !== threadId) request.current = { id: crypto.randomUUID(), body: text, thread: threadId };
    try {
      await sendMessage(threadId, text, request.current.id);
      request.current = { id: '', body: '', thread: '' };
      if (currentThread.current === threadId) setBody('');
      try {
        const rows = await getThreadMessages(threadId);
        if (currentThread.current === threadId) setMessages(old => mergeMessages(old,rows));
        await refresh();
      } catch { setError('Съобщението е изпратено, но историята не се обнови. Избери „Опитай отново“.'); }
    } catch { setError('Изпращането не е потвърдено. Текстът е запазен; опитай отново.'); }
    finally { setBusy(false); }
  };
  const thread = threads.find(item => item.id === selected);
  return <SiteLayout><div className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="text-3xl font-bold">Съобщения</h1><p className="mt-3 text-foreground-600">Разговорите са видими само за теб и другия участник.</p>
    {error && <div role="alert" className="my-4 rounded-md bg-background-100 p-3">{error}<button className="ml-3 text-primary-700 underline" onClick={() => setRetry(value => value + 1)}>Опитай отново</button></div>}
    <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside aria-label="Разговори" className="space-y-2">{loading ? <p role="status">Зареждане…</p> : !threads.length ? <p>Няма започнати разговори. Отвори обява и избери „Пиши на наемодателя“.</p> : threads.map(item => <button key={item.id} onClick={() => setParams({ razgovor: item.id })} aria-pressed={selected === item.id} className={`block w-full rounded-lg border p-4 text-left ${selected === item.id ? 'border-primary-500 bg-primary-50' : 'border-background-300'}`}><span className="block font-semibold">{item.listing?.title ?? 'Обява'}</span><span className="mt-1 block text-xs">{item.owner_id === user?.id ? 'Кандидат наемател' : 'Наемодател'} · {new Date(item.updated_at).toLocaleDateString('bg-BG')}</span></button>)}{moreThreads && <button disabled={threadsLoading} onClick={loadThreads} className="w-full rounded-md border px-4 py-3">{threadsLoading ? 'Зареждане…' : 'Още разговори'}</button>}</aside>
      <section className="rounded-lg border border-background-200 bg-background-50 p-5">{thread ? <>
        <h2 className="text-xl font-bold">{thread.listing?.title ?? 'Разговор'}</h2>{thread.listing?.slug && <Link to={`/obiava/${thread.listing.slug}`} className="mt-2 inline-block text-sm text-primary-700 underline">Виж обявата</Link>}
        {moreMessages && <button disabled={historyLoading} onClick={older} className="mt-4 rounded-md border px-4 py-2">{historyLoading ? 'Зареждане…' : 'По-стари съобщения'}</button>}
        <ol aria-label="Съобщения в разговора" className="my-5 max-h-[50dvh] space-y-3 overflow-y-auto">{messages.map(message => <li key={message.id} className={`max-w-[90%] rounded-lg p-3 ${message.sender_id === user?.id ? 'ml-auto bg-primary-50' : 'bg-background-100'}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><p className="mt-2 text-xs text-foreground-600">{message.sender_id === user?.id ? 'Ти' : 'Другият участник'} · {new Date(message.created_at).toLocaleString('bg-BG')}</p></li>)}</ol>
        <form onSubmit={send}><label htmlFor="message-body" className="block font-semibold">Твоето съобщение</label><textarea id="message-body" required minLength={1} maxLength={2000} value={body} onChange={e => setBody(e.target.value)} className="mt-2 w-full rounded-md border border-background-300 bg-background-50 p-3" rows={3} /><p className="text-xs text-foreground-600">{body.length}/2000 · Пази разговора и не изпращай банкови кодове.</p><button disabled={busy || !body.trim()} className="mt-3 rounded-md bg-primary-600 px-5 py-3 font-semibold text-background-50 disabled:opacity-50">{busy ? 'Изпращане…' : 'Изпрати'}</button></form>
      </> : <p>{selected && !loading ? 'Този разговор не е достъпен за твоя акаунт.' : 'Избери разговор или намери жилище, за което да попиташ.'}</p>}</section>
    </div></div></SiteLayout>;
}
