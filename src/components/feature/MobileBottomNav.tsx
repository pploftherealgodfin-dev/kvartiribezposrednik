import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
export default function MobileBottomNav(){
  const {session}=useAuth();
  const tabs=[{to:'/tarsene',label:'Търси',icon:'ri-search-line'},{to:'/lyubimi',label:'Любими',icon:'ri-heart-line'},{to:'/kachi-obiava',label:'Обява',icon:'ri-add-circle-line'},session?{to:'/saobshteniya',label:'Съобщения',icon:'ri-chat-3-line'}:{to:'/kvartiri-bez-posrednik',label:'Градове',icon:'ri-map-pin-line'},{to:session?'/moi-profil':'/vhod',label:session?'Акаунт':'Вход',icon:'ri-user-line'}];
  return <nav aria-label="Бърза навигация" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-background-200 bg-background-50 lg:hidden"><div className="mx-auto flex h-[62px] max-w-lg">{tabs.map(tab=><NavLink key={tab.to} to={tab.to} className={({isActive})=>'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium '+(isActive?'text-primary-800':'text-foreground-600')}><i className={tab.icon+' text-xl'} aria-hidden="true" /><span>{tab.label}</span></NavLink>)}</div></nav>;
}
