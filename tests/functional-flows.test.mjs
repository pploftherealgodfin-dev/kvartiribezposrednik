import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act, useState } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="test-root"></div></body></html>', { url: 'https://kvartiribezposrednik.com/', pretendToBeVisual: true });
for (const key of ['window','document','navigator','HTMLElement','HTMLDetailsElement','FormData','Event','MouseEvent','KeyboardEvent']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const { createRoot } = await import('react-dom/client');
const api = await import('../.test-build/entry.mjs');
const h = React.createElement;
let root, lastAuth, lastFavorites, navigate;
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const user = id => ({ id, email: `${id}@example.invalid`, email_confirmed_at:'2026-10-02T00:00:00Z', user_metadata:{} });
const auth = (id='alice', role='tenant') => ({ session:id ? {user:user(id)} : null, user:id ? user(id) : null, profile:id ? {id,role,name:id,ownerVerified:false} : null, loading:false, profileLoading:false, profileError:false, retryProfile:()=>{}, signOut:async()=>{}, signInWithGoogle:async()=>({error:null}), signInWithPhone:async()=>({error:null}), verifyPhoneOtp:async()=>({error:null}) });
const favorites = {favoriteIds:[],loading:false,error:'',busyIds:[],isFavorite:()=>false,toggle:async()=>{},reload:()=>{}};
function Observe() { lastAuth = api.useAuth(); lastFavorites = api.useFavorites(); navigate = useNavigate(); const location = useLocation(); return h('output',{'data-path':location.pathname+location.search}); }
function wrap(children, identity=auth(), path='/') { return h(MemoryRouter,{initialEntries:[path]},h(api.AuthContext.Provider,{value:identity},h(api.FavoritesContext.Provider,{value:favorites},children))); }
async function render(children, identity=auth(), path='/') { await act(async()=>root.render(wrap(children,identity,path))); }
async function flush() { await act(async()=>{ await new Promise(resolve=>setImmediate(resolve)); }); }
async function click(element) { assert.ok(element,'button exists'); await act(async()=>{element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));}); }
async function submit(form) { assert.ok(form,'form exists'); await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));}); }
async function fill(element,value) { assert.ok(element,'field exists'); await act(async()=>{ const prototype=element.tagName==='TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : element.tagName==='SELECT' ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,value); element.dispatchEvent(new dom.window.Event(element.tagName==='SELECT'?'change':'input',{bubbles:true})); }); }
const button = text => [...document.querySelectorAll('button')].find(item=>item.textContent.includes(text));
const text = () => document.getElementById('test-root').textContent;
const eq = (call,key) => call.steps?.find(([op,args])=>op==='eq'&&args[0]===key)?.[1][1];
beforeEach(async()=>{
  if(root) await act(async()=>root.unmount());
  document.getElementById('test-root').innerHTML=''; root=createRoot(document.getElementById('test-root'));
  window.localStorage.clear(); window.sessionStorage.clear(); api.resetBackend(); lastAuth=null; lastFavorites=null;
});
after(async()=>{ await act(async()=>root.unmount()); dom.window.close(); });

test('a late initial session cannot overwrite a newer sign-in event', async()=>{
  const initial=deferred(); api.handlers.auth=()=>initial.promise;
  api.handlers.rpc=()=>({data:null,error:null});
  api.handlers.query=call=>({data:{id:eq(call,'id'),role:'owner',name:'Собственик',owner_verified:false},error:null});
  await render(h(api.AuthProvider,null,h(Observe)));
  await act(async()=>api.emitAuth({user:user('alice')})); await flush();
  assert.equal(lastAuth.user.id,'alice'); assert.equal(lastAuth.profile.role,'owner');
  await act(async()=>initial.resolve({data:{session:null},error:null}));
  assert.equal(lastAuth.user.id,'alice');
});
test('a profile from an earlier account is hidden while the next profile is pending',async()=>{
  const next=deferred();
  api.handlers.auth=()=>({data:{session:{user:user('alice')}},error:null});
  api.handlers.query=call=>eq(call,'id')==='bob' ? next.promise : {data:{id:'alice',role:'owner',name:'alice'},error:null};
  await render(h(api.AuthProvider,null,h(Observe))); await flush();
  assert.equal(lastAuth.profile.id,'alice');
  await act(async()=>api.emitAuth({user:user('bob')}));
  assert.equal(lastAuth.profile,null); assert.equal(lastAuth.profileLoading,true);
  await act(async()=>next.resolve({data:{id:'bob',role:'tenant',name:'bob'},error:null}));
  assert.equal(lastAuth.profile.id,'bob');
});
test('private page state is remounted when the authenticated account changes',async()=>{
  function Private(){const [value,setValue]=useState(0);return h('button',{onClick:()=>setValue(value+1)},`private ${value}`);}
  const page=h(api.RequireRole,{allow:['tenant']},h(Private));
  await render(page,auth('alice')); await click(button('private')); assert.match(text(),/private 1/);
  await render(page,auth('bob')); assert.match(text(),/private 0/);
});
test('a failed favorites read blocks changes until an explicit reload succeeds',async()=>{
  let failed=true; api.handlers.query=()=>failed ? {data:null,error:new Error('offline')} : {data:[{listing_id:'home'}],error:null};
  await render(h(api.FavoritesProvider,null,h(Observe))); await flush();
  assert.ok(lastFavorites.error);
  await act(async()=>lastFavorites.toggle('another')); assert.equal(api.calls.filter(c=>c.kind==='upsert').length,0);
  failed=false; await act(async()=>lastFavorites.reload()); await flush();
  assert.deepEqual(lastFavorites.favoriteIds,['home']); assert.equal(lastFavorites.error,'');
});
test('double favorite clicks use one write and a failure rolls back the optimistic state',async()=>{
  const write=deferred(); api.handlers.query=call=>call.kind==='upsert' ? write.promise : {data:[],error:null};
  await render(h(api.FavoritesProvider,null,h(Observe))); await flush();
  let first; await act(async()=>{ first=lastFavorites.toggle('home'); void lastFavorites.toggle('home'); });
  assert.equal(api.calls.filter(c=>c.kind==='upsert').length,1); assert.deepEqual(lastFavorites.favoriteIds,['home']);
  await act(async()=>write.resolve({data:null,error:new Error('offline')})); await first;
  assert.deepEqual(lastFavorites.favoriteIds,[]); assert.ok(lastFavorites.error);
});
test('a previous account cannot roll back or unlock the next account favorite',async()=>{
  const first=deferred(), second=deferred();
  api.handlers.query=call=>call.kind==='upsert' ? (call.args.rows.user_id==='alice' ? first.promise : second.promise) : {data:[],error:null};
  const page=h(api.FavoritesProvider,null,h(Observe)); await render(page,auth('alice')); await flush();
  let a,b; await act(async()=>{a=lastFavorites.toggle('home');});
  await render(page,auth('bob')); await flush(); await act(async()=>{b=lastFavorites.toggle('home');});
  await act(async()=>first.resolve({data:null,error:new Error('offline')})); await a;
  assert.deepEqual(lastFavorites.favoriteIds,['home']); assert.deepEqual(lastFavorites.busyIds,['home']); assert.equal(lastFavorites.error,'');
  await act(async()=>second.resolve({data:null,error:null})); await b;
});
test('token refresh for the same account does not reload or discard favorites',async()=>{
  api.handlers.query=()=>({data:[{listing_id:'home'}],error:null}); const page=h(api.FavoritesProvider,null,h(Observe));
  await render(page,auth('alice')); await flush(); const count=api.calls.length;
  await render(page,{...auth('alice'),session:{user:{...user('alice'),updated_at:'later'}}});
  assert.equal(api.calls.length,count); assert.deepEqual(lastFavorites.favoriteIds,['home']);
});
test('guests cannot reveal contacts or start a conversation',async()=>{
  await render(h(api.ListingContactPanel,{listingId:'home',slug:'home',ownerId:'owner',active:true}),auth(null));
  assert.equal(document.querySelector('a[href^="tel:"]'),null); assert.match(text(),/Контакт след вход/); assert.equal(api.calls.length,0);
});
test('contact requests are deduplicated and late responses cannot leak into another account',async()=>{
  const read=deferred(); api.handlers.rpc=()=>read.promise; const page=h(api.ListingContactPanel,{listingId:'home',slug:'home',ownerId:'owner',active:true});
  await render(page,auth('alice')); await click(button('Покажи контактите')); await click(button('Зареждане'));
  assert.equal(api.calls.length,1);
  await render(page,auth('bob')); await act(async()=>read.resolve({data:[{display_name:'Private Alice',phone:'+359888123456',email:'owner@example.invalid'}],error:null}));
  assert.equal(document.querySelector('a[href^="tel:"]'),null); assert.doesNotMatch(text(),/Private Alice/);
});
test('inactive listings cannot reveal contacts or open new messages',async()=>{
  await render(h(api.ListingContactPanel,{listingId:'home',slug:'home',ownerId:'owner',active:false}));
  assert.ok(button('Покажи контактите').disabled); assert.ok(button('Обявата вече не е активна').disabled); assert.equal(api.calls.length,0);
});
test('photo metadata recovers a committed insert whose response was lost',async()=>{
  let inserted=false;
  api.handlers.query=call=>{
    if(call.kind==='insert'){inserted=true;return {data:null,error:new Error('lost response')};}
    return {data:inserted?[{storage_path:'owner/home/photo.jpg',position:0}]:[],error:null};
  };
  await api.addListingPhotos('home',['owner/home/photo.jpg']);
  assert.equal(api.calls.filter(c=>c.kind==='insert').length,1); assert.equal(api.calls.filter(c=>c.name==='remove').length,0);
  await api.addListingPhotos('home',['owner/home/photo.jpg']); assert.equal(api.calls.filter(c=>c.kind==='insert').length,1);
});
test('uploads are cleaned up when the pre-insert metadata read fails',async()=>{
  api.handlers.query=()=>({data:null,error:new Error('offline')});
  await assert.rejects(api.addListingPhotos('home',['owner/home/photo.jpg']));
  assert.equal(api.calls.filter(c=>c.name==='remove').length,1);
});
test('storage cleanup failure does not pretend to restore a deleted photo row',async()=>{
  api.handlers.query=call=>({data:call.kind==='delete'?{id:'photo'}:{storage_path:'owner/home/photo.jpg'},error:null});
  api.handlers.storage=()=>({data:null,error:new Error('offline')});
  assert.equal(await api.deleteListingPhoto('photo'),false);
});
test('a zero-row photo deletion is an error, not success',async()=>{
  api.handlers.query=call=>({data:call.kind==='delete'?null:{storage_path:'owner/home/photo.jpg'},error:null});
  await assert.rejects(api.deleteListingPhoto('photo'),/не е премахната/);
  assert.equal(api.calls.filter(c=>c.name==='remove').length,0);
});
test('photo management blocks mutation on a failed load and offers a working retry',async()=>{
  let failed=true; api.handlers.query=()=>failed?{data:null,error:new Error('offline')}:{data:[],error:null};
  await render(h(api.ListingPhotosManager,{listingId:'home',ownerId:'alice'})); await flush();
  assert.ok(document.querySelector('input[type="file"]').disabled); assert.ok(button('Обнови снимките'));
  failed=false; await click(button('Обнови снимките')); await flush(); assert.equal(document.querySelector('input[type="file"]').disabled,false);
});
test('expired photo URLs get one access-checked refresh and stop after a second image failure',async()=>{
  api.handlers.query=()=>({data:{storage_path:'owner/home/photo.jpg'},error:null});
  await render(h(api.ListingImage,{photoId:'photo',src:'https://images.invalid/old',alt:'Жилище'}));
  await act(async()=>document.querySelector('img').dispatchEvent(new Event('error'))); await flush();
  assert.match(document.querySelector('img').src,/fresh=1/);
  await act(async()=>document.querySelector('img').dispatchEvent(new Event('error'))); await flush();
  assert.equal(document.querySelector('img'),null); assert.equal(api.calls.filter(c=>c.name==='sign').length,1);
});
test('search validation rejects malformed numeric, boolean and repeated URL filters',()=>{
  for(const value of ['abc','Infinity','NaN','0x10','1e5']) assert.ok(api.validateSearchFilters(api.parseFilters(new URLSearchParams(`cena-do=${value}`))));
  assert.ok(api.validateSearchParams(new URLSearchParams('domashni=2')));
  assert.ok(api.validateSearchParams(new URLSearchParams('grad=sofia&grad=varna')));
  assert.equal(api.validateSearchFilters(api.parseFilters(new URLSearchParams('cena-ot=0&cena-do=450.50&etazh-ot=0&stai=2,4%2B'))),'');
});
test('search locations cannot be mixed across cities',()=>{
  const catalog={cities:[{id:'s',slug:'sofia'},{id:'v',slug:'varna'}],neighborhoods:[{cityId:'v',slug:'center'}],universities:[{cityId:'v',slug:'uni'}]};
  for(const query of ['grad=unknown','grad=sofia&kvartal=center','grad=sofia&universitet=uni']) assert.ok(api.validateSearchFilters(api.parseFilters(new URLSearchParams(query)),catalog));
});
test('the search UI does not send an invalid URL filter to Supabase',async()=>{
  await render(h(api.SearchPage),auth(null),'/tarsene?cena-do=NaN'); await flush();
  assert.equal(api.calls.filter(c=>c.name==='search_listing_ids').length,0); assert.match(text(),/Цената и площта/);
});
test('return URLs reject encoded redirects, login loops and control characters',()=>{
  for(const path of ['https://evil.invalid','//evil.invalid','/%2f%2fevil.invalid','/%255cevil.invalid','/vhod?next=/vhod','/vhod#again','/foo%00']) assert.equal(api.safeReturnPath(path),'');
  assert.equal(api.safeReturnPath('/obiava/home?x=1'),'/obiava/home?x=1');
});
test('SMS login validates the number locally and supports retry after a transport failure',async()=>{
  let sends=0; const identity={...auth(null),signInWithPhone:async()=>{sends++;return {error:sends===1?'offline':null};}};
  await render(h(api.Login),identity,'/vhod'); await fill(document.getElementById('auth-phone'),'not a phone'); await submit(document.querySelector('form')); assert.equal(sends,0);
  await fill(document.getElementById('auth-phone'),'+359 888 123 456'); await submit(document.querySelector('form')); assert.equal(sends,1); assert.match(text(),/offline/);
  await submit(document.querySelector('form')); assert.ok(document.getElementById('auth-otp')); assert.ok(button('Изпрати нов код след').disabled);
});
test('the SMS verification form rejects incomplete codes before calling Auth',async()=>{
  let verifications=0; const identity={...auth(null),verifyPhoneOtp:async()=>{verifications++;return {error:null};}};
  await render(h(api.Login),identity,'/vhod'); await fill(document.getElementById('auth-phone'),'+359888123456'); await submit(document.querySelector('form'));
  await fill(document.getElementById('auth-otp'),'123'); await submit(document.querySelector('form')); assert.equal(verifications,0);
  await fill(document.getElementById('auth-otp'),'123456'); await submit(document.querySelector('form')); assert.equal(verifications,1);
});
test('MFA transport failures release the button and preserve the protected gate',async()=>{
  api.handlers.auth=call=>call.name==='mfa.level'?{data:{currentLevel:'aal1'},error:null}:call.name==='mfa.factors'?{data:{totp:[{id:'factor',status:'verified'}]},error:null}:Promise.reject(new Error('offline'));
  await render(h(api.StaffMfaGate,null,h('p',null,'protected content'))); await flush();
  await fill(document.querySelector('input'),'123456'); await submit(document.querySelector('form')); await flush();
  assert.doesNotMatch(text(),/protected content/); assert.equal(button('Потвърди входа').disabled,false); assert.match(text(),/Кодът не е потвърден/);
});
test('moderators have no admin-only user-management controls',async()=>{
  await render(h(api.AdminUsers,{users:[{id:'bob',name:'bob',role:'tenant',status:'active'}],canManage:false,currentUserId:'alice',onChanged:()=>{}}));
  assert.equal(document.querySelector('button'),null);
});
test('moderation requires a meaningful reason and deduplicates repeated submissions',async()=>{
  const change=deferred(); let writes=0; await render(h(api.ModerationAction,{label:'Одобри',onConfirm:()=>{writes++;return change.promise;}}));
  await click(button('Одобри')); await fill(document.querySelector('textarea'),'          '); await submit(document.querySelector('form')); assert.equal(writes,0);
  await fill(document.querySelector('textarea'),'Извършен е преглед на условията.'); await submit(document.querySelector('form')); await submit(document.querySelector('form')); assert.equal(writes,1);
  await act(async()=>change.resolve()); assert.equal(document.querySelector('form'),null);
});
test('report validation blocks external URLs and whitespace-only descriptions',async()=>{
  await assert.rejects(api.submitReport(null,'fake','          '));
  await assert.rejects(api.submitReport(null,'fake','Съмнително поведение','https://evil.invalid/'));
  assert.equal(api.calls.length,0);
  api.handlers.rpc=()=>({data:'receipt',error:null}); assert.equal(await api.submitReport(null,'fake','Съмнително поведение','https://kvartiribezposrednik.com'),'receipt');
  assert.equal(api.calls[0].args.p_listing_url,'https://kvartiribezposrednik.com/');
});
test('a report receipt and private draft do not remain visible to the next account',async()=>{
  api.handlers.rpc=()=>({data:'private-receipt',error:null}); const page=h(api.ReportContent); await render(page,auth('alice'));
  await fill(document.querySelector('textarea'),'Съмнително поведение'); await submit(document.querySelector('form')); assert.match(text(),/private-receipt/);
  await render(page,auth('bob')); assert.doesNotMatch(text(),/private-receipt/); assert.equal(document.querySelector('textarea').value,'');
});

test('contact form deduplicates submissions and preserves values on failure',async()=>{
  const original=globalThis.fetch; const request=deferred(); let writes=0;
  globalThis.fetch=()=>{writes++;return request.promise;};
  function Form(){const state=api.useFormSubmit({endpoint:'https://forms.invalid',honeypotField:'trap',genericError:'Не е потвърдено'});return h('form',{onSubmit:event=>{event.preventDefault();void state.submit(event.currentTarget);}},h('input',{name:'name',defaultValue:'Alice'}),h('textarea',{name:'message',defaultValue:'Въпрос за платформата'}),h('p',{'data-status':state.status},state.error));}
  try {
    await render(h(Form)); await submit(document.querySelector('form')); await submit(document.querySelector('form')); assert.equal(writes,1);
    await act(async()=>request.reject(new Error('offline'))); assert.equal(document.querySelector('textarea').value,'Въпрос за платформата'); assert.equal(document.querySelector('[data-status]').dataset.status,'error');
  } finally {globalThis.fetch=original;}
});
test('contact form accepts only the documented success response',async()=>{
  const original=globalThis.fetch; let ok=false;
  globalThis.fetch=async()=>({ok:true,text:async()=>JSON.stringify(ok?{code:'OK'}:{code:'ERROR'})});
  let formState; function Form(){formState=api.useFormSubmit({endpoint:'https://forms.invalid',honeypotField:'trap',genericError:'Не е потвърдено'});return h('form',{onSubmit:e=>{e.preventDefault();void formState.submit(e.currentTarget);}},h('input',{name:'name',defaultValue:'Alice'}),h('textarea',{name:'message',defaultValue:'Въпрос'}));}
  try {await render(h(Form)); await submit(document.querySelector('form')); assert.equal(formState.status,'error'); ok=true; await submit(document.querySelector('form')); assert.equal(formState.status,'success');}
  finally {globalThis.fetch=original;}
});

test('conversation drafts survive switching threads and ambiguous sends reuse their request id',async()=>{
  const rows=[{id:'one',owner_id:'owner',tenant_id:'alice',updated_at:'2026-10-02',listing:{title:'Едно',slug:'one'}},{id:'two',owner_id:'owner',tenant_id:'alice',updated_at:'2026-10-01',listing:{title:'Две',slug:'two'}}];
  api.handlers.query=call=>({data:call.name==='conversations'?(eq(call,'id')?rows.find(row=>row.id===eq(call,'id')):rows):[],error:null});
  api.handlers.rpc=()=>({data:null,error:new Error('response lost')});
  await render(h(React.Fragment,null,h(Observe),h(api.MessagesPage)),auth('alice'),'/saobshteniya?razgovor=one'); await flush();
  await fill(document.getElementById('message-body'),'Здравейте, свободно ли е жилището?'); await submit(document.querySelector('form')); await flush();
  const first=api.calls.find(call=>call.name==='send_message').args.p_request_id;
  await act(async()=>{ navigate('/saobshteniya?razgovor=two'); }); await flush(); assert.equal(document.getElementById('message-body').value,'');
  await fill(document.getElementById('message-body'),'Втори въпрос'); await submit(document.querySelector('form')); await flush();
  await act(async()=>{ navigate('/saobshteniya?razgovor=one'); }); await flush(); assert.match(document.getElementById('message-body').value,/Здравейте/);
  await submit(document.querySelector('form')); await flush(); const sends=api.calls.filter(call=>call.name==='send_message'); assert.equal(sends[2].args.p_request_id,first);
});

const catalog={cities:[{id:'sofia',slug:'sofia',name:'София',region:'София'}],neighborhoods:[],universities:[]};
async function completeListingDetails(){
  await click(document.getElementById('nf-city')); await click(document.getElementById('nf-city-option-1')); await submit(document.querySelector('form'));
  await fill(document.getElementById('nf-title'),'Светло студио под наем');
  await fill(document.getElementById('nf-description'),'Жилището има отделна кухня и удобен градски транспорт. Огледи по уговорка.');
  for(const [id,value] of [['nf-price','450.50'],['nf-area','38'],['nf-rooms','1'],['nf-floor','0'],['nf-deposit','0'],['nf-available','2026-10-10']]) await fill(document.getElementById(id),value);
  await submit(document.querySelector('form'));
}
async function selectTestPhoto(){
  // Pixel decoding is substituted here. Real decoding and uploads require browser E2E.
  const originalImage=globalThis.Image, originalCreate=URL.createObjectURL, originalRevoke=URL.revokeObjectURL;
  const originalContext=window.HTMLCanvasElement.prototype.getContext, originalBlob=window.HTMLCanvasElement.prototype.toBlob;
  globalThis.Image=class{naturalWidth=640;naturalHeight=480;decode(){return Promise.resolve();}};
  URL.createObjectURL=()=>`blob:fixture-${crypto.randomUUID()}`; URL.revokeObjectURL=()=>{};
  window.HTMLCanvasElement.prototype.getContext=()=>({drawImage:()=>{}});
  window.HTMLCanvasElement.prototype.toBlob=callback=>callback(new Blob([new Uint8Array([1,2,3])],{type:'image/png'}));
  try{
    const input=document.querySelector('input[type="file"]'); Object.defineProperty(input,'files',{configurable:true,value:[new File([new Uint8Array([1,2,3])],'photo.png',{type:'image/png'})]});
    await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true}))); await flush();
  }finally{globalThis.Image=originalImage;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;window.HTMLCanvasElement.prototype.getContext=originalContext;window.HTMLCanvasElement.prototype.toBlob=originalBlob;}
}
test('the publishing form validates each step and cannot send an empty photo step',async()=>{
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>{},onCancel:()=>{}}));
  await submit(document.querySelector('form')); assert.equal(api.calls.length,0); assert.equal(document.activeElement.id,'nf-city');
  await completeListingDetails(); await submit(document.querySelector('form'));
  assert.equal(api.calls.filter(c=>c.kind==='insert').length,0); assert.equal(document.activeElement.id,'nf-photos');
});
test('publication records one pending listing, preserves zero values and links its uploaded photo',async()=>{
  let saved=null, completed=0;
  api.handlers.query=call=>{
    if(call.name==='listings'&&call.kind==='insert'){saved=call.args;return {data:null,error:null};}
    if(call.name==='listings')return {data:saved,error:null};
    return {data:[],error:null};
  };
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>{completed++;},onCancel:()=>{}}));
  await completeListingDetails(); await selectTestPhoto(); await submit(document.querySelector('form'));
  const confirm=document.querySelector('fieldset:not([hidden]) input[type="checkbox"]'); await click(confirm);
  await act(async()=>{document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}); await flush();
  assert.equal(completed,1); assert.equal(api.calls.filter(c=>c.name==='listings'&&c.kind==='insert').length,1);
  assert.equal(saved.status,'pending_review'); assert.equal(saved.price_eur,450.5); assert.equal(saved.floor,0); assert.equal(saved.deposit,0);
  const photo=api.calls.find(c=>c.name==='listing_photos'&&c.kind==='insert'); assert.equal(photo.args[0].listing_id,saved.id); assert.match(photo.args[0].storage_path,new RegExp(`alice/${saved.id}/`));
});
test('a saved listing with an unconfirmed photo upload redirects to its existing record without duplication',async()=>{
  let saved=null, canceled=0, completed=0;
  api.handlers.query=call=>{
    if(call.name==='listings'&&call.kind==='insert'){saved=call.args;return {data:null,error:null};}
    return {data:call.name==='listings'?saved:[],error:null};
  };
  api.handlers.storage=()=>({data:null,error:new Error('upload unavailable')});
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>{completed++;},onCancel:()=>{canceled++;}}));
  await completeListingDetails(); await selectTestPhoto(); await submit(document.querySelector('form')); await click(document.querySelector('fieldset:not([hidden]) input[type="checkbox"]')); await submit(document.querySelector('form')); await flush();
  assert.equal(completed,0); assert.match(text(),/Обявата е записана/); assert.ok(document.querySelector('fieldset:not([hidden])').disabled);
  await submit(document.querySelector('form')); assert.equal(canceled,1); assert.equal(api.calls.filter(c=>c.name==='listings'&&c.kind==='insert').length,1);
});
test('a lost listing-insert response is recovered and changed retry data cannot create a duplicate',async()=>{
  let saved=null;
  api.handlers.query=call=>{
    if(call.kind==='insert'){saved=call.args;return {data:null,error:new Error('response lost')};}
    return {data:saved,error:null};
  };
  const input={title:'Светло студио',description:'Жилището има отделна кухня и удобен транспорт.',cityId:'sofia',neighborhoodId:null,nearbyUniversityIds:[],priceEur:450.5,areaM2:38,rooms:1,type:'studio',deposit:0,floor:0,totalFloors:null,furnished:true,petsAllowed:false,utilitiesIncluded:false,availableFrom:'2026-10-10'};
  const id=crypto.randomUUID(); const created=await api.createOwnerListing('alice',input,id); assert.equal(created.id,id);
  assert.equal((await api.createOwnerListing('alice',input,id)).id,id);
  await assert.rejects(api.createOwnerListing('alice',{...input,priceEur:500},id),/предишните данни/);
  assert.equal(api.calls.filter(c=>c.kind==='insert').length,1);
});
