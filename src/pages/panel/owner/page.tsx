import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { getOwnerStats, type OwnerStats } from '@/lib/repository/owner';
import OwnerListings from './components/OwnerListings';
export default function OwnerPanelPage(){
  const {profile}=useAuth();const ownerId=profile?.id??'';const [params]=useSearchParams();
  const [stats,setStats]=useState<OwnerStats|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
  const load=useCallback(async()=>{if(!ownerId)return;setLoading(true);setError(false);try{setStats(await getOwnerStats(ownerId));}catch{setError(true);}finally{setLoading(false);}},[ownerId]);
  useEffect(()=>{if(params.get('nova')!=='1')void load();},[load,params]);
  if(params.get('nova')==='1')return <Navigate to="/kachi-obiava" replace />;
  const pending=stats?.listings.filter(item=>item.status==='pending_review').length??0;
  return <SiteLayout><div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-3xl font-semibold">Моите обяви</h1><p className="mt-3 text-sm text-foreground-600">Статус, снимки и управление на твоите имоти.</p></div><Link to="/kachi-obiava" className="ui-button"><i className="ri-add-line" aria-hidden="true" />Нова обява</Link></div>
    {!error&&<dl className="mt-7 grid grid-cols-3 gap-3 rounded-xl border border-background-200 p-4"><div><dt className="ui-note">Общо</dt><dd className="mt-1 text-xl font-semibold">{loading?'…':stats?.totalListings??0}</dd></div><div><dt className="ui-note">Публични</dt><dd className="mt-1 text-xl font-semibold text-primary-800">{loading?'…':stats?.activeListings??0}</dd></div><div><dt className="ui-note">В преглед</dt><dd className="mt-1 text-xl font-semibold">{loading?'…':pending}</dd></div></dl>}
    <p className="ui-note mt-4">Всяка нова обява се проверява. При редакция на снимки първо деактивирай публичната обява и я изпрати за нов преглед.</p>
    {error?<div role="alert" className="ui-panel mt-6"><p>Обявите не се заредиха.</p><button className="ui-secondary mt-4" onClick={load}>Опитай отново</button></div>:<OwnerListings listings={stats?.listings??[]} loading={loading} onChanged={load} ownerId={ownerId} />}
  </div></SiteLayout>;
}
