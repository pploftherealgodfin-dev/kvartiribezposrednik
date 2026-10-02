import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { dashboardPath } from '@/lib/roles';
export default function AccountNav(){
  const {session,profile}=useAuth();const {pathname}=useLocation();
  if(!session||!/^\/(panel\/|lyubimi|saobshteniya|nastroyki|kachi-obiava|admin)/.test(pathname))return null;
  const items=[{to:dashboardPath(profile?.role),label:profile?.role==='owner'?'Моите обяви':'Моят профил'},{to:'/lyubimi',label:'Любими'},{to:'/saobshteniya',label:'Съобщения'},{to:'/nastroyki',label:'Настройки'}];
  return <div className="border-b border-background-200"><nav aria-label="Навигация на акаунта" className="mx-auto flex max-w-6xl overflow-x-auto px-4 md:px-6">{items.map(item=><NavLink key={item.to} to={item.to} className={({isActive})=>'shrink-0 border-b-2 px-3 py-4 text-xs sm:text-sm '+(isActive?'border-primary-600 font-semibold text-primary-800':'border-transparent text-foreground-600')}>{item.label}</NavLink>)}</nav></div>;
}
