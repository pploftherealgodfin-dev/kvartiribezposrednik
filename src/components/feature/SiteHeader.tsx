import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { dashboardPath } from '@/lib/roles';
const links=[{to:'/tarsene',label:'Търси жилище'},{to:'/kvartiri-bez-posrednik',label:'Градове'},{to:'/saveti',label:'Съвети'}];
export default function SiteHeader() {
  const {session,profile,signOut,loading}=useAuth();
  const location=useLocation();const navigate=useNavigate();
  const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const header=useRef<HTMLElement>(null);const menu=useRef<HTMLButtonElement>(null);
  useEffect(()=>{setOpen(false);},[location.pathname,location.search,location.hash]);
  useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);menu.current?.focus();}};const outside=(event:PointerEvent)=>{if(!header.current?.contains(event.target as Node))setOpen(false);};document.addEventListener('keydown',close);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',outside);};},[open]);
  const logout=async()=>{if(busy)return;setBusy(true);setError('');try{await signOut();setOpen(false);navigate('/');}catch{setError('Изходът не е потвърден. Опитай отново.');}finally{setBusy(false);}};
  return <header ref={header} className="pt-safe sticky top-0 z-40 border-b border-background-200 bg-background-50">
    <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
      <Link to="/" aria-label="Квартири без посредник — начало" className="shrink-0"><span className="block text-[17px] font-extrabold leading-none tracking-tight">Квартири</span><span className="mt-1 block text-[11px] font-medium leading-none text-primary-700">без посредник</span></Link>
      <nav aria-label="Основна навигация" className="hidden items-center gap-6 lg:flex">{links.map(item=><NavLink key={item.to} to={item.to} className={({isActive})=>'py-3 text-sm font-medium '+(isActive?'text-primary-800':'text-foreground-600 hover:text-primary-700')}>{item.label}</NavLink>)}</nav>
      <div className="flex items-center gap-2"><Link to="/kachi-obiava" className="ui-button hidden px-4 sm:inline-flex"><i className="ri-add-line" aria-hidden="true" />Качи обява</Link>
        {!session&&!loading&&<Link to="/vhod" className="hidden min-h-11 items-center px-3 text-sm font-medium lg:inline-flex">Вход</Link>}
        <button ref={menu} type="button" aria-label={session?'Меню на акаунта':'Меню'} aria-expanded={open} aria-controls="account-menu" onClick={()=>setOpen(value=>!value)} className="flex min-h-11 items-center gap-2 rounded-lg border border-background-200 px-3 text-sm hover:bg-background-100"><i className={session?'ri-user-line text-lg':open?'ri-close-line text-lg':'ri-menu-line text-lg'} aria-hidden="true" /><span className="hidden max-w-28 truncate lg:block">{session?'Акаунт':'Още'}</span></button>
      </div>
    </div>
    {error&&<p role="alert" className="border-t border-background-200 px-4 py-3 text-center text-sm">{error}</p>}
    {open&&<nav id="account-menu" aria-label="Меню и акаунт" className="absolute right-4 top-full mt-2 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-background-200 bg-background-50 p-2 shadow-lg">
      {links.map(item=><Link key={item.to} to={item.to} className="block rounded-lg px-4 py-3 text-sm hover:bg-background-100 lg:hidden">{item.label}</Link>)}
      {session?<><p className="mx-4 border-b border-background-200 py-3 text-xs text-foreground-600">{profile?.name||'Твоят акаунт'}</p>{[{to:dashboardPath(profile?.role),label:profile?.role==='owner'?'Моите обяви':'Моят профил'},{to:'/lyubimi',label:'Любими'},{to:'/saobshteniya',label:'Съобщения'},{to:'/nastroyki',label:'Контакт и настройки'}].map(item=><Link key={item.to} to={item.to} className="block rounded-lg px-4 py-3 text-sm hover:bg-primary-50">{item.label}</Link>)}<button type="button" disabled={busy} onClick={logout} className="w-full rounded-lg border-t border-background-200 px-4 py-3 text-left text-sm text-foreground-600">{busy?'Излизане…':'Изход'}</button></>:<><Link to="/vhod" className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-primary-50">Вход / регистрация</Link><Link to="/kak-raboti" className="block rounded-lg px-4 py-3 text-sm hover:bg-background-100">Как работи</Link></>}
      <Link to="/kachi-obiava" className="ui-button mt-2 w-full sm:hidden">Качи обява</Link>
    </nav>}
  </header>;
}
