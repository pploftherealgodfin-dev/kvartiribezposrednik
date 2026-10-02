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
function Observe() { lastAuth = api.useAuth(); lastFavorites = api.useFavorites(); navigate = useNavigate(); const location = useLocation(); return h('output',{'data-path':location.pathname+location.search,'data-hash':location.hash,'data-from':location.state?.from ?? ''}); }
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
  api.setListingDraftSession('alice');
});
after(async()=>{ await act(async()=>root.unmount()); dom.window.close(); });

test('the Readdy navigation bridge becomes ready only after the router mounts',async()=>{
  let ready=false; api.navigatePromise.then(()=>{ready=true;}); await Promise.resolve();
  assert.equal(ready,false); assert.equal(window.REACT_APP_NAVIGATE,undefined);
  await render(h(React.Fragment,null,h(api.AppRoutes),h(Observe)),auth(null),'/faq');
  assert.equal(ready,true); assert.equal(typeof window.REACT_APP_NAVIGATE,'function');
  await act(async()=>{window.REACT_APP_NAVIGATE('/kontakti');});
  assert.equal(document.querySelector('output').dataset.path,'/kontakti');
});
test('the promised navigation handle uses the current path and preserves options and history',async()=>{
  await render(h(React.Fragment,null,h(api.AppRoutes),h(Observe)),auth(null),'/faq');
  const externalNavigate=await api.navigatePromise;
  await act(async()=>{externalNavigate('/kvartiri-bez-posrednik/varna');});
  await act(async()=>{externalNavigate({search:'?sektor=universiteti'});});
  assert.equal(document.querySelector('output').dataset.path,'/kvartiri-bez-posrednik/varna?sektor=universiteti');
  await act(async()=>{externalNavigate('/kvartiri-bez-posrednik');});
  assert.equal(document.querySelector('output').dataset.path,'/kvartiri-bez-posrednik');
  await act(async()=>{externalNavigate({pathname:'/tarsene',search:'?grad=varna',hash:'#filters'},{replace:true,state:{from:'readdy'}});});
  const output=document.querySelector('output');
  assert.equal(output.dataset.path,'/tarsene?grad=varna'); assert.equal(output.dataset.hash,'#filters'); assert.equal(output.dataset.from,'readdy');
  await act(async()=>{externalNavigate(-1);});
  assert.equal(document.querySelector('output').dataset.path,'/kvartiri-bez-posrednik/varna?sektor=universiteti');
});
test('StrictMode cleanup releases the Readdy bridge and the resolved handle survives remounting',async()=>{
  const page=h(React.StrictMode,null,h(api.AppRoutes),h(Observe));
  await render(page,auth(null),'/faq'); const externalNavigate=await api.navigatePromise;
  await act(async()=>root.render(null));
  assert.equal(window.REACT_APP_NAVIGATE,undefined);
  assert.throws(()=>externalNavigate('/kontakti'),/Навигацията още не е готова/);
  await render(page,auth(null),'/faq');
  await act(async()=>{externalNavigate('/kontakti');});
  assert.equal(document.querySelector('output').dataset.path,'/kontakti');
});
test('external Readdy navigation respects guest access gates and the login return route',async()=>{
  await render(h(React.Fragment,null,h(api.AppRoutes),h(Observe)),auth(null),'/faq');
  const externalNavigate=await api.navigatePromise;
  for (const path of ['/admin','/saobshteniya','/kachi-obiava']) {
    await act(async()=>{externalNavigate(path);}); await flush();
    assert.equal(document.querySelector('output').dataset.path,'/vhod');
    assert.equal(document.querySelector('output').dataset.from,path);
  }
});

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
  await click(document.getElementById('nf-city')); await click(document.getElementById('nf-city-option-1'));
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
    const input=document.querySelector('input[type="file"]'); Object.defineProperty(input,'files',{configurable:true,value:[new File([pngHeader(640,480)],'photo.png',{type:'image/png'})]});
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

function pngHeader(width, height) {
  const bytes=new Uint8Array(33), view=new DataView(bytes.buffer);
  bytes.set([137,80,78,71,13,10,26,10]); view.setUint32(8,13); bytes.set([73,72,68,82],12);
  view.setUint32(16,width); view.setUint32(20,height); bytes[24]=8; bytes[25]=2;
  return bytes;
}
function webpHeader(width,height) {
  const bytes=new Uint8Array(26),view=new DataView(bytes.buffer),encoder=new TextEncoder();
  bytes.set(encoder.encode('RIFF'));view.setUint32(4,18,true);bytes.set(encoder.encode('WEBPVP8L'),8);
  view.setUint32(16,5,true);bytes[20]=47;view.setUint32(21,(width-1)|((height-1)<<14),true);return bytes;
}
test('file inspection rejects disguised active content, mismatched types and malformed lengths',()=>{
  for(const mime of ['image/jpeg','image/png','image/webp']) assert.throws(()=>api.inspectPhotoBytes(new TextEncoder().encode('<svg onload="alert(1)"></svg>'),mime));
  assert.throws(()=>api.inspectPhotoBytes(pngHeader(640,480),'image/jpeg'));
  const bad=pngHeader(640,480);new DataView(bad.buffer).setUint32(8,0xffffffff);assert.throws(()=>api.inspectPhotoBytes(bad,'image/png'));
  const webp=webpHeader(640,480);new DataView(webp.buffer).setUint32(16,0xffffffff,true);assert.throws(()=>api.inspectPhotoBytes(webp,'image/webp'));
});
test('JPEG, PNG and WebP headers expose bounded dimensions before decoding',()=>{
  assert.deepEqual(api.inspectPhotoBytes(pngHeader(640,480),'image/png'),{width:640,height:480});
  assert.deepEqual(api.inspectPhotoBytes(webpHeader(1920,1080),'image/webp'),{width:1920,height:1080});
  const jpeg=new Uint8Array([255,216,255,192,0,8,8,1,224,2,128,1]);
  assert.deepEqual(api.inspectPhotoBytes(jpeg,'image/jpeg'),{width:640,height:480});
  for(const bytes of [pngHeader(100000,1),pngHeader(8000,8000)]) assert.throws(()=>api.inspectPhotoBytes(bytes,'image/png'));
  assert.throws(()=>api.inspectPhotoBytes(webpHeader(16000,16000),'image/webp'));
});
test('oversized pixel headers and empty files are rejected before allocating an Image',async()=>{
  const original=globalThis.Image;let decoded=0;globalThis.Image=class{constructor(){decoded++;}};
  try {
    await assert.rejects(api.prepareListingPhoto(new File([pngHeader(12000,12000)],'large.png',{type:'image/png'})));
    await assert.rejects(api.prepareListingPhoto(new File([],'empty.png',{type:'image/png'})));
    assert.equal(decoded,0);assert.equal(api.calls.length,0);
  } finally {globalThis.Image=original;}
});
test('animated uploads are rejected before rasterizing the first frame',()=>{
  const bytes=new Uint8Array(45);bytes.set(pngHeader(640,480));const view=new DataView(bytes.buffer);
  view.setUint32(33,0);bytes.set(new TextEncoder().encode('acTL'),37);
  assert.throws(()=>api.inspectPhotoBytes(bytes,'image/png'),/анимация/);
  const webp=new Uint8Array(30);webp.set(new TextEncoder().encode('RIFF'));new DataView(webp.buffer).setUint32(4,22,true);
  webp.set(new TextEncoder().encode('WEBPVP8X'),8);new DataView(webp.buffer).setUint32(16,10,true);webp[20]=2;
  assert.throws(()=>api.inspectPhotoBytes(webp,'image/webp'),/анимация/);
});
test('public configuration rejects server keys, user tokens and insecure endpoints',()=>{
  const jwt=role=>'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.fixture';
  assert.equal(api.validatePublicSupabaseConfig('https://project.supabase.co',jwt('anon')),'https://project.supabase.co');
  assert.equal(api.validatePublicSupabaseConfig('https://project.supabase.co','sb_publishable_fixture'),'https://project.supabase.co');
  for(const key of ['sb_secret_fixture',jwt('service_role'),jwt('authenticated'),'garbage','']) assert.throws(()=>api.validatePublicSupabaseConfig('https://project.supabase.co',key));
  for(const url of ['http://project.supabase.co','https://user:pass@project.supabase.co','https://project.supabase.co/?key=x','javascript:alert(1)','ftp://localhost']) assert.throws(()=>api.validatePublicSupabaseConfig(url,jwt('anon'),true));
  assert.equal(api.validatePublicSupabaseConfig('http://localhost:54321',jwt('anon'),true),'http://localhost:54321');
});
const savedDraftValue=()=>({draft:{...api.emptyListingDraft(),cityId:'sofia',title:'Светло студио под наем',description:'Жилището е обзаведено и има отделна кухня и добър градски транспорт.',price:'450',area:'38'},step:2,requestId:'',createdId:''});
test('draft storage is scoped to the current account, expires and never saves photo or contact fields',()=>{
  const value=savedDraftValue();value.photos=['blob:private'];value.draft.email='private@example.invalid';
  assert.equal(api.saveListingDraft('alice',value),true);
  const serialized=window.sessionStorage.getItem('kb_listing_draft_v1');assert.ok(!serialized.includes('blob:private'));assert.ok(!serialized.includes('private@example.invalid'));
  const draft=api.readListingDraft('alice');assert.equal(draft.draft.title,value.draft.title);
  assert.equal(api.readListingDraft('bob'),null);
  assert.equal(api.readListingDraft('alice',draft.updatedAt+api.DRAFT_TTL_MS),null);assert.equal(window.sessionStorage.length,0);
  api.saveListingDraft('alice',value);api.setListingDraftSession('bob');assert.equal(window.sessionStorage.length,0);
  api.saveListingDraft('bob',{...value,draft:{...value.draft,title:'Обява на Боб'}});
  assert.equal(api.saveListingDraft('alice',value),false);api.clearListingDraft('alice');assert.equal(api.readListingDraft('bob').draft.title,'Обява на Боб');
  api.setListingDraftSession(null);assert.equal(window.sessionStorage.length,0);assert.equal(api.saveListingDraft('bob',value),false);
});
test('malformed or future-dated saved drafts are discarded without trusting arbitrary fields',()=>{
  for(const value of [{version:1,ownerId:'alice',updatedAt:Date.now()+120000,...savedDraftValue()}, {version:1,ownerId:'alice',updatedAt:Date.now(),...savedDraftValue(),draft:{title:{html:'attack'}}}, {version:1,ownerId:'alice',updatedAt:Date.now(),...savedDraftValue(),requestId:'not-a-uuid'}]){
    window.sessionStorage.setItem('kb_listing_draft_v1',JSON.stringify(value));assert.equal(api.readListingDraft('alice'),null);assert.equal(window.sessionStorage.length,0);
  }
});
test('the three-step form restores text but requires photos and a new review before publishing',async()=>{
  api.saveListingDraft('alice',savedDraftValue());
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>{},onCancel:()=>{}}));await flush();
  assert.equal(document.querySelectorAll('ol[aria-label="Стъпки за качване"] li').length,3);
  assert.equal(document.getElementById('nf-title').value,'Светло студио под наем');assert.ok(text().includes('Възстановихме'));
  assert.equal(document.querySelectorAll('img').length,0);
  await submit(document.querySelector('form'));assert.equal(api.calls.filter(c=>c.kind==='insert').length,0);assert.equal(document.activeElement.id,'nf-photos');
});
test('a recorded publication survives reload as an existing record instead of a new submission',async()=>{
  const id='018f2700-0000-4000-8000-000000000001';let canceled=0;
  api.saveListingDraft('alice',{...savedDraftValue(),requestId:id,createdId:id});
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>assert.fail('not a new record'),onCancel:()=>{canceled++;}}));
  assert.ok(text().includes('Обявата вече е записана'));await submit(document.querySelector('form'));assert.equal(canceled,1);assert.equal(api.calls.length,0);
});
test('a lost create response retains its UUID through reload and retries without inserting twice',async()=>{
  let saved=null,failedRead=true,completed=0;
  api.handlers.query=call=>{
    if(call.name==='listings'&&call.kind==='insert'){assert.equal(saved,null);saved=call.args;return{data:null,error:{message:'connection lost'}};}
    if(call.name==='listings')return{data:saved,error:saved&&failedRead?{message:'connection lost'}:null};
    return{data:null,error:null};
  };
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>{completed++;},onCancel:()=>{}}));
  await completeListingDetails();await selectTestPhoto();await submit(document.querySelector('form'));await click(document.querySelector('fieldset:not([hidden]) input[type="checkbox"]'));await submit(document.querySelector('form'));await flush();
  assert.equal(completed,0);assert.equal(api.readListingDraft('alice').requestId,saved.id);
  await render(null);failedRead=false;
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>{completed++;},onCancel:()=>{}}));await flush();
  await selectTestPhoto();await submit(document.querySelector('form'));await click(document.querySelector('fieldset:not([hidden]) input[type="checkbox"]'));await submit(document.querySelector('form'));await flush();
  assert.equal(completed,1);assert.equal(api.calls.filter(c=>c.name==='listings'&&c.kind==='insert').length,1);assert.equal(api.readListingDraft('alice'),null);
});
test('auth refresh preserves a draft but sign-out clears it and fences old saves',async()=>{
  api.handlers.auth=()=>({data:{session:{user:user('alice')}},error:null});
  api.handlers.query=()=>({data:{id:'alice',role:'owner',name:'alice',owner_verified:false},error:null});
  await render(h(api.AuthProvider,null,h(Observe)));await flush();api.saveListingDraft('alice',savedDraftValue());
  await act(async()=>api.emitAuth({user:user('alice')},'TOKEN_REFRESHED'));assert.ok(api.readListingDraft('alice'));
  await act(async()=>api.emitAuth(null,'SIGNED_OUT'));assert.equal(window.sessionStorage.length,0);assert.equal(api.saveListingDraft('alice',savedDraftValue()),false);
});
test('the home form requests only the selected city and ignores late results from another city',async()=>{
  const old=deferred();
  const cities=[{id:'city-home-sofia',slug:'sofia',name:'София'},{id:'city-home-varna',slug:'varna',name:'Варна'}];
  api.handlers.query=call=>{
    const city=eq(call,'city_id');assert.ok(city,'geographic reads are city scoped');
    if(city==='city-home-sofia')return old.promise;
    return{data:[{id:call.name+'-varna',city_id:city,slug:'varna-location',name:call.name==='neighborhoods'?'Квартал Варна':'Университет Варна',lat:null,lng:null}],error:null};
  };
  await render(h(api.HomeSearchForm,{cities}));assert.equal(api.calls.length,0);
  await click(document.getElementById('home-search-city'));await click([...document.querySelectorAll('[role="option"]')].find(item=>item.textContent==='София'));
  assert.equal(document.getElementById('home-search-city').value,'София');assert.equal(document.getElementById('home-search-neighborhood').disabled,true);
  await click(document.getElementById('home-search-city'));await click([...document.querySelectorAll('[role="option"]')].find(item=>item.textContent==='Варна'));await flush();
  assert.equal(document.getElementById('home-search-neighborhood').placeholder,'Всички квартали');assert.equal(document.getElementById('home-search-neighborhood').disabled,false);
  await act(async()=>old.resolve({data:[{id:'old',city_id:'city-home-sofia',slug:'old',name:'Стар квартал София',lat:null,lng:null}],error:null}));await flush();
  await click(document.getElementById('home-search-neighborhood'));assert.ok(text().includes('Квартал Варна'));assert.ok(!text().includes('Стар квартал'));
});
test('off-screen latest listings do not fetch until intersection and empty results skip all neighborhood reads',async()=>{
  const original=globalThis.IntersectionObserver;let observe,disconnected=0;
  globalThis.IntersectionObserver=class{constructor(callback){observe=callback;}observe(){}disconnect(){disconnected++;}};
  api.handlers.query=()=>({data:[],error:null});
  try{
    await render(h(api.LatestListingsSection),auth(null));assert.equal(api.calls.length,0);
    await act(async()=>observe([{isIntersecting:false}]));assert.equal(api.calls.length,0);
    await act(async()=>observe([{isIntersecting:true}]));await flush();await flush();
    assert.equal(api.calls.filter(c=>c.name==='listings').length,1);assert.equal(api.calls.filter(c=>c.name==='neighborhoods').length,0);assert.ok(text().includes('Още няма публични обяви'));assert.ok(document.querySelector('a[href="/kachi-obiava"]'));assert.ok(disconnected>0);
  }finally{globalThis.IntersectionObserver=original;}
});

test('returning to listing details keeps prepared photo previews alive and changes require a fresh confirmation',async()=>{
  const original=URL.revokeObjectURL, released=[];
  URL.revokeObjectURL=value=>released.push(value);
  try{
    await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>{},onCancel:()=>{}}));
    await completeListingDetails();await selectTestPhoto();const cover=document.querySelector('img').src;
    await click(button('Назад'));assert.equal(released.length,0);
    await submit(document.querySelector('form'));await submit(document.querySelector('form'));
    assert.equal(document.querySelector('fieldset:not([hidden]) img').src,cover);
    await click(document.querySelector('fieldset:not([hidden]) input[type="checkbox"]'));
    await click(button('Редактирай жилището'));await fill(document.getElementById('nf-price'),'460');
    await submit(document.querySelector('form'));await submit(document.querySelector('form'));
    assert.equal(document.querySelector('fieldset:not([hidden]) input[type="checkbox"]').checked,false);
  }finally{URL.revokeObjectURL=original;}
});
test('a late publication callback cannot overwrite another account draft or upload its photos',async()=>{
  const waiting=deferred();let inserted=null;
  api.handlers.query=call=>{
    if(call.name==='listings'&&call.kind==='insert'){inserted=call.args;return waiting.promise;}
    return{data:call.name==='listings'?null:[],error:null};
  };
  await render(h(api.ListingForm,{ownerId:'alice',...catalog,onCreated:()=>assert.fail('old page callback'),onCancel:()=>{}}));
  await completeListingDetails();await selectTestPhoto();await submit(document.querySelector('form'));await click(document.querySelector('fieldset:not([hidden]) input[type="checkbox"]'));await submit(document.querySelector('form'));assert.ok(inserted);
  api.setListingDraftSession('bob');api.saveListingDraft('bob',{...savedDraftValue(),draft:{...savedDraftValue().draft,title:'Чернова на Боб'}});
  await render(null);await act(async()=>waiting.resolve({data:null,error:null}));await flush();
  assert.equal(api.readListingDraft('bob').draft.title,'Чернова на Боб');assert.equal(api.calls.filter(c=>c.kind==='storage'&&c.name==='upload').length,0);
});

test('logout removes an authorized private listing before passive effects can clear old state',async()=>{
  const original=api.repository.getListingViewBySlug, pending=deferred(), snapshots=[];
  const view={listing:{id:'private-listing',slug:'private',title:'PRIVATE LISTING TITLE',description:'PRIVATE LISTING DETAILS',status:'pending_review',type:'studio',cityId:'sofia',neighborhoodId:null,photos:[],priceEur:450,areaM2:38,rooms:1,floor:null,totalFloors:null,deposit:null,availableFrom:'2026-10-10',minTermMonths:1,furnished:true,petsAllowed:false,utilitiesIncluded:false,nearbyUniversityIds:[]},city:{id:'sofia',name:'София',slug:'sofia'},neighborhood:null,owner:{id:'alice',name:'Private owner name',verifiedOwner:false,memberSince:'2026-10-02'},badges:{verifiedOwner:false,isNew:false,isRented:false}};
  let reads=0;api.repository.getListingViewBySlug=()=>++reads===1?Promise.resolve(view):pending.promise;
  function Probe({actor}){React.useLayoutEffect(()=>{snapshots.push({actor,value:text()});},[actor]);return null;}
  const page=actor=>h(React.Fragment,null,h(api.ListingDetailPage),h(Probe,{actor}));
  try{
    await render(page('alice'),auth('alice','owner'),'/obiava/private');await flush();assert.ok(text().includes('PRIVATE LISTING TITLE'));
    await render(page('guest'),auth(null),'/obiava/private');
    const guest=snapshots.find(item=>item.actor==='guest');assert.ok(guest);assert.ok(!guest.value.includes('PRIVATE LISTING TITLE'));assert.ok(!guest.value.includes('Private owner name'));
    await act(async()=>pending.resolve(null));await flush();
  }finally{api.repository.getListingViewBySlug=original;}
});

const pilotId='acacacac-acac-4cac-8cac-acacacacacac';
const pilotRow={id:pilotId,slug:'pilot',status:'pending_review',title:'Светло пилотно студио',description:'Светло жилище с отделна кухня и удобен градски транспорт. Огледи по уговорка.',type:'studio',price_eur:'450.50',area_m2:'38',rooms:1,city_id:'sofia',neighborhood_id:null,nearby_university_ids:[],available_from:'2026-10-10',deposit:0,floor:0,total_floors:null,furnished:true,pets_allowed:false,utilities_included:false,photos:[{id:'photo'}]};
async function editablePilot(){api.handlers.query=()=>({data:pilotRow,error:null});return api.getCurrentOwnerListing('alice');}
const editConfirmation=()=>[...document.querySelectorAll('form label')].find(label=>label.textContent.includes('Приемам повторния преглед'))?.querySelector('input');
test('the current listing read scopes the account, retains zero values and excludes removed history',async()=>{
  const listing=await editablePilot(),call=api.calls[0];
  assert.equal(eq(call,'owner_id'),'alice');assert.ok(call.steps.some(([op,args])=>op==='neq'&&args[0]==='status'&&args[1]==='removed'));
  assert.equal(listing.draft.price,'450.50');assert.equal(listing.draft.deposit,'0');assert.equal(listing.draft.floor,'0');assert.equal(listing.draft.totalFloors,'');assert.equal(listing.photoCount,1);
});
test('an existing listing and a failed quota read both keep the new publication form closed',async()=>{
  api.handlers.query=()=>({data:pilotRow,error:null});
  await render(h(api.UploadPage),auth('alice','owner'));await flush();
  assert.ok(text().includes('Светло пилотно студио'));assert.equal(document.getElementById('nf-title'),null);assert.ok(document.querySelector(`a[href="/kachi-obiava?redaktirai=${pilotId}"]`));
  api.handlers.query=()=>({data:null,error:new Error('read unavailable')});
  await render(h(api.UploadPage),auth('bob','owner'));await flush();
  assert.ok(text().includes('не създавай втора обява'));assert.equal(document.getElementById('nf-title'),null);
});
test('switching publishing accounts clears the old listing before a late read resolves',async()=>{
  const next=deferred(),snapshots=[];
  api.handlers.query=call=>eq(call,'owner_id')==='alice'?{data:pilotRow,error:null}:next.promise;
  function Probe({actor}){React.useLayoutEffect(()=>{snapshots.push({actor,value:text()});},[actor]);return null;}
  const page=actor=>h(React.Fragment,null,h(api.UploadPage),h(Probe,{actor}));
  await render(page('alice'),auth('alice','owner'));await flush();assert.ok(text().includes(pilotRow.title));
  await render(page('bob'),auth('bob','owner'));assert.ok(!snapshots.find(item=>item.actor==='bob').value.includes(pilotRow.title));
  await act(async()=>next.resolve({data:null,error:new Error('offline')}));await flush();assert.ok(!text().includes(pilotRow.title));
});
test('editing uses a whitelisted RPC, serializes double submissions and reuses a failed request',async()=>{
  const listing=await editablePilot(),waiting=deferred();let saved=0;
  api.handlers.rpc=()=>waiting.promise;
  await render(h(api.EditListingForm,{listing,...catalog,onSaved:()=>saved++,onCancel:()=>{}}),auth('alice','owner'));
  await click(editConfirmation());
  await act(async()=>{const form=document.querySelector('form');form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  const edits=()=>api.calls.filter(call=>call.name==='owner_edit_listing');assert.equal(edits().length,1);
  const first=edits()[0].args;assert.equal(first.p_id,pilotId);assert.equal(first.p_input.floor,0);assert.equal(first.p_input.deposit,0);assert.equal(first.p_input.price_eur,450.5);
  for(const key of ['status','owner_id','ownership_verified_at','verification_expires_at'])assert.equal(key in first.p_input,false);
  await act(async()=>waiting.resolve({data:null,error:new Error('response lost')}));await flush();
  assert.ok(text().includes('Записът не е потвърден'));assert.equal(saved,0);
  api.handlers.rpc=()=>({data:null,error:null});await submit(document.querySelector('form'));
  assert.equal(edits().length,2);assert.equal(edits()[1].args.p_request_id,first.p_request_id);assert.equal(saved,1);assert.equal(api.calls.filter(call=>call.kind==='insert').length,0);
});
test('changed edit data clears confirmation and starts a new request without a second listing',async()=>{
  const listing=await editablePilot();api.handlers.rpc=()=>({data:null,error:new Error('response lost')});
  await render(h(api.EditListingForm,{listing,...catalog,onSaved:()=>{},onCancel:()=>{}}),auth('alice','owner'));
  await click(editConfirmation());await submit(document.querySelector('form'));
  const first=api.calls.find(call=>call.name==='owner_edit_listing').args.p_request_id;
  await fill(document.getElementById('nf-price'),'460');assert.equal(editConfirmation().checked,false);
  await submit(document.querySelector('form'));assert.equal(api.calls.filter(call=>call.name==='owner_edit_listing').length,1);
  await click(editConfirmation());await submit(document.querySelector('form'));
  const edits=api.calls.filter(call=>call.name==='owner_edit_listing');assert.notEqual(edits[1].args.p_request_id,first);assert.equal(edits[1].args.p_input.price_eur,460);
});
test('the database quota error sends concurrent publication attempts to the existing listing',async()=>{
  api.handlers.query=call=>({data:null,error:call.kind==='insert'?{code:'23505',message:'duplicate key violates unique constraint listings_one_current_per_owner'}:null});
  const input={title:pilotRow.title,description:pilotRow.description,type:'studio',cityId:'sofia',neighborhoodId:null,nearbyUniversityIds:[],priceEur:450.5,areaM2:38,rooms:1,availableFrom:'2026-10-10',floor:0,totalFloors:null,deposit:0,furnished:true,petsAllowed:false,utilitiesIncluded:false};
  await assert.rejects(api.createOwnerListing('alice',input,crypto.randomUUID()),/една обява.*Редактирай/);
});
test('owner status actions cannot dispatch twice before React renders the busy state',async()=>{
  const waiting=deferred();api.handlers.rpc=()=>waiting.promise;let changed=0;
  await render(h(api.OwnerListings,{ownerId:'alice',loading:false,onChanged:()=>changed++,listings:[{id:pilotId,slug:'pilot',title:'Пилотно студио',status:'active',priceEur:450,createdAt:'2026-10-02',views:0,uniqueViews:0,favorites:0,photos:1}]}),auth('alice','owner'));
  const rented=button('Отбележи като наета')??button('Нает');assert.ok(rented);
  await act(async()=>{rented.dispatchEvent(new MouseEvent('click',{bubbles:true}));rented.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  assert.equal(api.calls.filter(call=>call.name==='owner_set_listing_status').length,1);
  await act(async()=>waiting.resolve({data:null,error:null}));assert.equal(changed,1);
});
test('moderation shows photo readiness and a separate truthful property-verification status',async()=>{
  api.handlers.query=call=>({data:call.name==='listings'?[{...pilotRow,owner_id:'alice',created_at:'2026-10-02',ownership_verified_at:null,verification_expires_at:null}]:[{id:'alice',name:'Собственик'}],error:null});
  const rows=await api.getAdminListings();assert.equal(rows[0].photoCount,1);assert.equal(rows[0].propertyVerified,false);
  await render(h(api.AdminListings,{listings:rows,onChanged:()=>{}}),auth('moderator','moderator'));
  assert.ok(text().includes('без документна проверка'));assert.ok(text().includes('Правото за отдаване не е проверено'));assert.ok(!text().includes('pending_review'));
  await render(h(api.AdminListings,{listings:[{...rows[0],photoCount:0}],onChanged:()=>{}}),auth('moderator','moderator'));
  assert.ok(text().includes('поне една реална снимка'));
});
test('official social links match Organization sameAs and metadata retains the Readdy image after navigation',async()=>{
  await render(h(api.SiteFooter),auth(null));
  const schema=api.organizationJsonLd();assert.deepEqual(schema.sameAs,api.SOCIAL_PROFILES.map(profile=>profile.url));
  for(const profile of api.SOCIAL_PROFILES){const link=[...document.querySelectorAll('a')].find(item=>item.href===profile.url);assert.ok(link);assert.equal(link.target,'_blank');assert.ok(link.rel.includes('noopener'));}
  const oldPath=window.location.pathname;
  try{
    window.history.replaceState(null,'','/obiava/pilot');api.applyPageMeta({title:'Реална обява',ogImage:'https://images.invalid/actual.jpg'});
    assert.equal(document.querySelector('meta[property="og:image"]').content,'https://images.invalid/actual.jpg');
    window.history.replaceState(null,'','/');api.applyPageMeta({title:'Начало'});
    assert.equal(document.querySelector('meta[property="og:image"]').content,api.SITE_SOCIAL_IMAGE);assert.equal(document.querySelector('meta[name="twitter:image"]').content,api.SITE_SOCIAL_IMAGE);
    assert.equal(document.querySelector('meta[property="og:locale"]').content,'bg_BG');
  }finally{window.history.replaceState(null,'',oldPath);}
});
