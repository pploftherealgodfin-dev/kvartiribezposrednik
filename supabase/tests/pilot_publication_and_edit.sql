-- Regression fixtures only. No real listings are approved, no file bytes/messages are sent.
-- SQL role/JWT simulation checks the server boundary; everything is rolled back.
begin;
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,is_anonymous) values
 ('e1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pilot-owner@example.invalid',now(),false),
 ('e2222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pilot-outsider@example.invalid',now(),false),
 ('e3333333-3333-4333-8333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pilot-staff@example.invalid',now(),false);
select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Пилот собственик','owner');
select set_config('request.jwt.claims','{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Пилот външен','tenant');
select set_config('request.jwt.claims','{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Пилот модератор','tenant');
update public.profiles set role='moderator' where id='e3333333-3333-4333-8333-333333333333';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
insert into public.listings(id,slug,owner_id,type,status,title,description,price_eur,area_m2,rooms,city_id,available_from)
select 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pilot-transaction-only',auth.uid(),'studio','pending_review','Пилотна обява в транзакция','Описание на реалния договор за публикуване. Тестовият запис не остава в базата.',450,38,1,id,current_date from public.cities where slug='sofia';
do $$ begin
 begin
  insert into public.listings(slug,owner_id,type,title,description,price_eur,area_m2,rooms,city_id,available_from)
  select 'pilot-duplicate-transaction',auth.uid(),'room','Втора обява в транзакция','Този втори запис трябва да бъде отхвърлен от сървърния лимит на акаунта.',250,20,1,id,current_date from public.cities where slug='sofia';
  raise exception 'Second current listing was accepted';
 exception when check_violation then
  if position('една обява' in sqlerrm)=0 then raise; end if;
 end;
 begin update public.listings set price_eur=1 where id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';raise exception 'Direct owner UPDATE allowed';exception when insufficient_privilege then null;end;
 begin perform public.moderate_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','Опит за самостоятелно одобрение');raise exception 'Owner approval allowed';exception when insufficient_privilege then null;end;
end $$;

select set_config('request.jwt.claims','{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 begin perform public.moderate_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','Пилотен тест на съдържание');raise exception 'Staff approval without MFA allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal2"}',true);
do $$ begin
 begin perform public.moderate_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','Пилотен тест без снимка');raise exception 'No-photo approval allowed';exception when check_violation then if position('снимка' in sqlerrm)=0 then raise;end if;end;
end $$;

select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
insert into storage.objects(bucket_id,name) values ('listing-photos','e1111111-1111-4111-8111-111111111111/eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp');
insert into public.listing_photos(listing_id,storage_path,position) values ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','e1111111-1111-4111-8111-111111111111/eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp',0);
select set_config('request.jwt.claims','{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal2"}',true);
select public.moderate_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','Транзакционен тест на одобрение без документна проверка');
do $$ begin
 if not exists(select 1 from public.listings where id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and status='active' and expires_at>now() and ownership_verified_at is null and verification_expires_at is null) then raise exception 'Optional verification did not preserve truthful status';end if;
end $$;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ declare result jsonb;begin
 if not exists(select 1 from public.listings where id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'Unverified approved listing is not public';end if;
 result:=public.search_listing_ids('{"citySlug":"sofia"}','newest',1,18);
 if not (result->'ids') @> '["eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]'::jsonb then raise exception 'Pilot listing missing from public search';end if;
 begin perform * from public.get_listing_contact('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');raise exception 'Anonymous contact access allowed';exception when insufficient_privilege then null;end;
 begin perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{}','eccccccc-cccc-4ccc-8ccc-cccccccccccc');raise exception 'Anonymous edit allowed';exception when insufficient_privilege then null;end;
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 begin perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{}','eccccccc-cccc-4ccc-8ccc-cccccccccccc');raise exception 'Cross-owner edit allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
do $$ declare payload jsonb;begin
 payload:=jsonb_build_object('title','Променена пилотна обява','description','Променените условия трябва да преминат нов преглед. Снимката остава в същата обява.',
 'type','studio','price_eur',475,'area_m2',38,'rooms',1,'city_id',(select id from public.cities where slug='sofia'),
 'neighborhood_id',null,'nearby_university_ids','[]'::jsonb,'available_from',current_date,'furnished',true,'pets_allowed',false,'utilities_included',false);
 perform set_config('kb.pilot_payload',payload::text,true);
 begin perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload||'{"status":"active"}','eccccccc-cccc-4ccc-8ccc-cccccccccccc');raise exception 'Owner injected publication status';exception when invalid_parameter_value then null;end;
 begin perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload||'{"ownership_verified_at":"2026-10-01"}','eccccccc-cccc-4ccc-8ccc-cccccccccccc');raise exception 'Owner injected verification';exception when invalid_parameter_value then null;end;
 perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload,'eccccccc-cccc-4ccc-8ccc-cccccccccccc');
 if not exists(select 1 from public.listings where id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and status='pending_review' and price_eur=475 and ownership_verified_at is null and expires_at is null) then raise exception 'Edited content did not enter review';end if;
 if (select count(*) from public.listing_photos where listing_id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>1 then raise exception 'Editing removed existing photo';end if;
 begin perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload||'{"price_eur":480}','eccccccc-cccc-4ccc-8ccc-cccccccccccc');raise exception 'Changed-data retry accepted';exception when invalid_parameter_value then null;end;
end $$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin if exists(select 1 from public.listings where id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'Edited pending listing leaked to public';end if;end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal2"}',true);
select public.moderate_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','Транзакционен повторен преглед на редакцията');
select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
select public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',current_setting('kb.pilot_payload')::jsonb,'eccccccc-cccc-4ccc-8ccc-cccccccccccc');
do $$ begin
 if (select status from public.listings where id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>'active' then raise exception 'Lost-response retry hid an already reapproved listing';end if;
 perform public.owner_set_listing_status('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','rented');
 begin
  insert into public.listings(slug,owner_id,type,title,description,price_eur,area_m2,rooms,city_id,available_from)
  select 'pilot-rented-duplicate',auth.uid(),'room','Втори имот след отдаване','Наетата обява също заема единственото място в пилотния акаунт.',250,20,1,id,current_date from public.cities where slug='sofia';raise exception 'Rented listing freed quota';
 exception when check_violation then if position('една обява' in sqlerrm)=0 then raise;end if;end;
 perform public.owner_set_listing_status('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pending_review');
end $$;
select set_config('request.jwt.claims','{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal2"}',true);
select public.moderate_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','flagged','Транзакционен тест на ограничение за редакция');
select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 begin perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',current_setting('kb.pilot_payload')::jsonb,'eddddddd-dddd-4ddd-8ddd-dddddddddddd');raise exception 'Flagged listing edit bypassed review restriction';exception when check_violation then null;end;
end $$;
reset role;
update public.profiles set status='suspended' where id='e1111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal2"}',true);
do $$ begin
 begin perform public.moderate_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','Транзакционен тест на неактивен акаунт');raise exception 'Suspended owner approval allowed';exception when check_violation then if position('активен' in sqlerrm)=0 then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 begin perform public.owner_edit_listing('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',current_setting('kb.pilot_payload')::jsonb,'eddddddd-dddd-4ddd-8ddd-dddddddddddd');raise exception 'Suspended owner edit allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from pg_index i join pg_class c on c.oid=i.indexrelid where c.relname='listings_one_current_per_owner' and i.indisunique and pg_get_expr(i.indpred,i.indrelid) like '%removed%') then raise exception 'Concurrent-insert unique guard missing';end if;
 if (select count(*) from private.audit_events where entity_id='eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and action='listing.owner_edit')<>1 then raise exception 'Edit retries duplicated audit receipts';end if;
end $$;
rollback;
select 'PASS: single-listing quota, optional verification, photos, staff MFA, owner edit/review/retry, privacy and account restrictions; fixtures rolled back' as result;
