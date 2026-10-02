import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
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
  const [threadLoading, setThreadLoading] = useState(Boolean(selected));
  const [messagesLoading, setMessagesLoading] = useState(Boolean(selected));
  const [historyLoading, setHistoryLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadOffset, setThreadOffset] = useState(100);
  const [moreThreads, setMoreThreads] = useState(false);
  const [moreMessages, setMoreMessages] = useState(false);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const requests = useRef(new Map<string, { id: string; body: string }>());
  const drafts = useRef(new Map<string, string>());
  const sendLocked = useRef(false);
  const history = useRef<HTMLOListElement>(null);
  const latestShown = useRef('');
  const previousScroll = useRef<{height: number; top: number; thread: string} | null>(null);
  const refresh = useCallback(async () => { const rows = await getThreads(); setThreads(old => mergeThreads(old,rows)); }, []);
  useEffect(() => {
    let live = true; setLoading(true); setError('');
    getThreads().then(rows => { if (live) { setThreads(rows); setThreadOffset(100); setMoreThreads(rows.length === 100); } })
      .catch(() => { if (live) setError('Разговорите не се заредиха.'); })
      .finally(() => { if (live) setLoading(false); });
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void getThreads().then(rows => { if (live) { setThreads(old => mergeThreads(old, rows)); setMoreThreads(old => old || rows.length === 100); } }).catch(() => { if (live) setError('Разговорите не се обновиха. Опитай отново.'); });
    }, 15000);
    return () => { live = false; window.clearInterval(timer); };
  }, [retry]);
  useEffect(() => {
    let live = true;
    setMessages([]); setMoreMessages(false); setError('');
    setBody(drafts.current.get(selected) ?? '');
    setHistoryLoading(false); latestShown.current = ''; previousScroll.current = null;
    setThreadLoading(Boolean(selected)); setMessagesLoading(Boolean(selected));
    if (!selected) return;
    const load = (initial = false) => getThreadMessages(selected).then(rows => {
      if (live) { setMessages(old => mergeMessages(old,rows)); if (initial) setMoreMessages(rows.length === 100); }
    }).catch(() => { if (live) setError('Съобщенията не се заредиха. Опитай отново.'); })
      .finally(() => { if (live && initial) setMessagesLoading(false); });
    void getThread(selected).then(item => {
      if (live) setThreads(old => item ? mergeThreads(old,[item]) : old.filter(row => row.id !== selected));
    }).catch(() => { if (live) setError('Разговорът не се зареди.'); })
      .finally(() => { if (live) setThreadLoading(false); });
    void load(true);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') { void load(); } }, 15000);
    return () => { live = false; window.clearInterval(timer); };
  }, [selected, refresh, retry]);
  useLayoutEffect(() => {
    const list = history.current;
    if (!list) return;
    const previous = previousScroll.current;
    if (previous?.thread === selected) {
      list.scrollTop = previous.top + list.scrollHeight - previous.height;
      previousScroll.current = null;
    } else {
      const last = messages.at(-1);
      if (last && last.id !== latestShown.current && (!latestShown.current || last.sender_id === user?.id || list.scrollHeight - list.scrollTop - list.clientHeight < 100)) list.scrollTop = list.scrollHeight;
    }
    latestShown.current = messages.at(-1)?.id ?? '';
  }, [messages, selected, threadLoading, user?.id]);
  const older = async () => {
    if (!messages.length || historyLoading) return;
    const threadId = selected; setHistoryLoading(true);
    try {
      const rows = await getThreadMessages(threadId,messages[0]);
      if (currentThread.current === threadId) {
        if (history.current) previousScroll.current = { height:history.current.scrollHeight, top:history.current.scrollTop, thread:threadId };
        setMessages(old => mergeMessages(old,rows)); setMoreMessages(rows.length === 100);
      }
    } catch { if (currentThread.current === threadId) setError('По-старите съобщения не се заредиха. Опитай отново.'); }
    finally { if (currentThread.current === threadId) setHistoryLoading(false); }
  };
  const loadThreads = async () => {
    if (threadsLoading) return; setThreadsLoading(true);
    try { const rows = await getThreads(threadOffset); setThreads(old => mergeThreads(old,rows)); setThreadOffset(value => value + 100); setMoreThreads(rows.length === 100); }
    catch { setError('Още разговори не се заредиха. Опитай отново.'); }
    finally { setThreadsLoading(false); }
  };
  const send = async (event: FormEvent) => {
    event.preventDefault(); if (!body.trim() || sendLocked.current || threadLoading || messagesLoading || !selected) return;
    const text = body.trim(); const threadId = selected;
    if (text.length > 2000) { setError('Съобщението може да е до 2000 знака.'); return; }
    sendLocked.current = true; setBusy(true); setError('');
    if (requests.current.get(threadId)?.body !== text) requests.current.set(threadId, { id: crypto.randomUUID(), body: text });
    const requestId = requests.current.get(threadId)!.id;
    try {
      await sendMessage(threadId, text, requestId);
      requests.current.delete(threadId); drafts.current.delete(threadId);
      if (currentThread.current === threadId) setBody('');
      try {
        const rows = await getThreadMessages(threadId);
        if (currentThread.current === threadId) setMessages(old => mergeMessages(old,rows));
        await refresh();
      } catch { if (currentThread.current === threadId) setError('Съобщението е изпратено, но историята не се обнови. Избери „Опитай отново“.'); }
    } catch { if (currentThread.current === threadId) setError('Изпращането не е потвърдено. Текстът е запазен; опитай отново.'); }
    finally { sendLocked.current = false; setBusy(false); }
  };
  const thread = threads.find(item => item.id === selected);
  return <SiteLayout><div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
    <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Съобщения</h1>
    <p className="ui-note mt-2">Разговорите са видими само за теб и другия участник.</p>
    {error && <div role="alert" className="my-4 rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm">{error}<button className="ml-3 min-h-11 text-primary-700 underline" onClick={() => setRetry(value => value + 1)}>Опитай отново</button></div>}
    <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside aria-label="Разговори" className={`space-y-2 ${selected ? 'hidden lg:block' : ''}`}>
        {loading ? <p role="status" className="ui-note">Зареждаме разговорите…</p> : !threads.length ? <div className="ui-panel"><h2 className="font-semibold">Тук започва разговорът</h2><p className="ui-note mt-2">Отвори обява и избери „Пиши на наемодателя“.</p><Link to="/tarsene" className="ui-button mt-4">Намери жилище</Link></div> : threads.map(item => <button key={item.id} onClick={() => setParams({ razgovor: item.id })} aria-pressed={selected === item.id} className={`block w-full rounded-lg border p-4 text-left ${selected === item.id ? 'border-primary-500 bg-primary-50' : 'border-background-300 bg-background-50 hover:border-primary-300'}`}><span className="block break-words text-sm font-semibold">{item.listing?.title ?? 'Обява'}</span><span className="mt-2 block text-xs text-foreground-600">{item.owner_id === user?.id ? 'Кандидат наемател' : 'Наемодател'} · {new Date(item.updated_at).toLocaleDateString('bg-BG')}</span></button>)}
        {moreThreads && <button disabled={threadsLoading} onClick={loadThreads} className="ui-secondary w-full">{threadsLoading ? 'Зареждане…' : 'Още разговори'}</button>}
      </aside>
      <section className={`ui-panel min-w-0 ${selected ? '' : 'hidden lg:block'}`}>
        {selected && <button onClick={() => setParams({})} className="mb-4 flex min-h-11 items-center gap-2 text-sm text-primary-700 lg:hidden"><i aria-hidden="true" className="ri-arrow-left-line" />Всички разговори</button>}
        {threadLoading ? <p role="status" className="ui-note">Зареждаме разговора…</p> : thread ? <>
          <h2 className="break-words text-lg font-semibold">{thread.listing?.title ?? 'Разговор'}</h2>
          {thread.listing?.slug && <Link to={`/obiava/${thread.listing.slug}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-primary-700 underline">Виж обявата</Link>}
          {moreMessages && <button disabled={historyLoading} onClick={older} className="ui-secondary mt-4">{historyLoading ? 'Зареждане…' : 'По-стари съобщения'}</button>}
          {messagesLoading && <p role="status" className="ui-note mt-4">Зареждаме съобщенията…</p>}
          {!messagesLoading && !messages.length && <p className="ui-note my-6">Попитай за условията или уговори оглед.</p>}
          <ol ref={history} aria-label="Съобщения в разговора" className="my-5 max-h-[50dvh] space-y-3 overflow-y-auto overscroll-contain">{messages.map(message => <li key={message.id} className={`max-w-[90%] rounded-lg p-3 ${message.sender_id === user?.id ? 'ml-auto bg-primary-50' : 'bg-background-100'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><p className="mt-2 text-xs text-foreground-600">{message.sender_id === user?.id ? 'Ти' : 'Другият участник'} · {new Date(message.created_at).toLocaleString('bg-BG')}</p></li>)}</ol>
          <form onSubmit={send}><label htmlFor="message-body" className="ui-label">Твоето съобщение</label><textarea id="message-body" required minLength={1} maxLength={2000} value={body} disabled={busy || messagesLoading} onChange={e => { setBody(e.target.value); drafts.current.set(selected, e.target.value); }} className="ui-field h-auto py-3" rows={3} /><p className="ui-note mt-2">{body.length}/2000 · Не изпращай банкови кодове.</p><button disabled={busy || messagesLoading || !body.trim()} className="ui-button mt-4">{busy ? 'Изпращане…' : 'Изпрати'}</button></form>
        </> : <div className="py-8 text-center"><p className="ui-note">{selected ? 'Този разговор не е достъпен за твоя акаунт.' : 'Избери разговор, за да видиш съобщенията.'}</p>{selected && <button onClick={() => setParams({})} className="ui-secondary mt-4">Към разговорите</button>}</div>}
      </section>
    </div></div></SiteLayout>;
}
