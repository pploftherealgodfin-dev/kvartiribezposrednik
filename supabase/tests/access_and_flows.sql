-- Run with the SQL admin connection. Everything including Auth fixtures is rolled back.
-- No SMS, mail, real account, public listing, or message is sent or left behind.
begin;
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,is_anonymous)
values
 ('11111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-test@example.invalid',now(),false),
 ('22222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenant-test@example.invalid',now(),false),
 ('33333333-3333-4333-8333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','outsider-test@example.invalid',now(),false),
 ('44444444-4444-4444-8444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','unverified-test@example.invalid',null,false);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Тест собственик','owner');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Тест наемател','tenant');
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Тест външен','tenant');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
insert into public.listings(id,slug,owner_id,type,title,description,price_eur,area_m2,rooms,floor,total_floors,furnished,pets_allowed,available_from,city_id,neighborhood_id,nearby_university_ids)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','transaction-only-fixture','11111111-1111-4111-8111-111111111111','apartment','Тестова обява в транзакция','Описание за проверка на филтри и достъп. Тестовите записи се премахват с ROLLBACK.',500,65,2,3,8,true,false,current_date,c.id,
 (select n.id from public.neighborhoods n where n.city_id=c.id order by slug limit 1),
 array[(select u.id from public.universities u where u.city_id=c.id order by slug limit 1)]
from public.cities c where c.slug='sofia';
-- Moderation fixture state set by the SQL administrator, without fake verification in persistent data.
update public.listings set status='active',expires_at=now()+interval '30 days',ownership_verified_at=now(),verification_expires_at=now()+interval '90 days',verification_method='document_review' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ declare r jsonb; begin
 if (select count(*) from public.cities)<>257 then raise exception 'Expected all 257 official cities'; end if;
 if not exists(select 1 from public.listings where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'Guest cannot see public listing'; end if;
 begin perform 1 from public.profiles; raise exception 'Guest could read profile'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.profile_contacts; raise exception 'Guest could read contact'; exception when insufficient_privilege then null; end;
 begin perform * from public.get_listing_contact('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'); raise exception 'Guest contact RPC allowed'; exception when insufficient_privilege then null; end;
 begin perform * from public.start_conversation('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'); raise exception 'Guest messaging allowed'; exception when insufficient_privilege then null; end;
 r:=public.search_listing_ids('{"citySlug":"sofia","rooms":[2],"priceMin":400,"priceMax":600,"floorMin":3,"floorMax":3,"furnished":true,"petsAllowed":false}'::jsonb,'cheapest',1,18);
 if (r->>'total')::int<>1 or jsonb_array_length(r->'ids')<>1 then raise exception 'Server filters failed: %',r; end if;
 r:=public.search_listing_ids('{"citySlug":"varna"}','newest',1,18);
 if (r->>'total')::int<>0 then raise exception 'City filter leaked Sofia result'; end if;
 r:=public.search_listing_ids('{"floorMin":4}','newest',1,18);
 if (r->>'total')::int<>0 then raise exception 'Floor filter ignored'; end if;
 r:=public.search_listing_ids('{"rooms":[1],"roomsMin":4}','newest',1,18);
 if (r->>'total')::int<>0 then raise exception 'Room OR filter failed'; end if;
 r:=public.search_listing_ids('{"petsAllowed":true}','newest',1,18);
 if (r->>'total')::int<>0 then raise exception 'Pets filter ignored'; end if;
 r:=public.search_listing_ids('{"citySlug":"sofia"}','newest',9000,18);
 if (r->>'page')::int<>1 then raise exception 'Pagination does not clamp'; end if;
 begin perform public.search_listing_ids('{"priceMin":600,"priceMax":400}','newest',1,18); raise exception 'Invalid range accepted'; exception when invalid_parameter_value then null; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',true);
do $$ declare cid uuid; mid uuid; contact record; r jsonb; uslug text; begin
 select * into contact from public.get_listing_contact('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 if contact.display_name<>'Тест собственик' or contact.email<>'owner-test@example.invalid' then raise exception 'Authenticated contact retrieval failed'; end if;
 -- Direct table access still exposes only the caller's contact, never another owner.
 if exists(select 1 from public.profile_contacts where id='11111111-1111-4111-8111-111111111111') then raise exception 'Direct contact RLS leak'; end if;
 insert into public.favorites(user_id,listing_id) values(auth.uid(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') on conflict do nothing;
 insert into public.favorites(user_id,listing_id) values(auth.uid(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') on conflict do nothing;
 if (select count(*) from public.favorites where listing_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>1 then raise exception 'Favorites are not idempotent'; end if;
 begin insert into public.favorites(user_id,listing_id) values('33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'); raise exception 'Cross-account favorite allowed'; exception when insufficient_privilege then null; end;
 cid:=public.start_conversation('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 perform set_config('kb.test_conversation',cid::text,true);
 if public.start_conversation('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>cid then raise exception 'Duplicate conversation'; end if;
 mid:=public.send_message(cid,'Проверка без изпращане извън транзакцията','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 if public.send_message(cid,'Проверка без изпращане извън транзакцията','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')<>mid then raise exception 'Message retry duplicated'; end if;
 if (select count(*) from public.messages where conversation_id=cid)<>1 then raise exception 'Message persistence failed'; end if;
 select u.slug into uslug from public.listings l join public.universities u on u.id=any(l.nearby_university_ids) where l.id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 r:=public.search_listing_ids(jsonb_build_object('citySlug','sofia','universitySlug',uslug),'newest',1,18);
 if (r->>'total')::int<>1 then raise exception 'University filter lost explicit association'; end if;
 r:=public.search_listing_ids('{"universitySlug":"unknown-university"}','newest',1,18);
 if (r->>'total')::int<>0 then raise exception 'Unknown university ignored'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 if exists(select 1 from public.messages) or exists(select 1 from public.conversations) then raise exception 'Unrelated account can read a conversation'; end if;
 begin perform public.send_message(current_setting('kb.test_conversation')::uuid,'Чужд достъп','cccccccc-cccc-4ccc-8ccc-cccccccccccc'); raise exception 'Unauthorized message allowed'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',true);
do $$ declare bad_hood uuid; bad_uni uuid; cid uuid; begin
 if (select count(*) from public.messages)<>1 then raise exception 'Owner cannot read message'; end if;
 select id into cid from public.conversations where listing_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 perform public.send_message(cid,'Отговор от собственика','dddddddd-dddd-4ddd-8ddd-dddddddddddd');
 begin perform public.start_conversation('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'); raise exception 'Owner started conversation with self'; exception when check_violation then null; end;
 select n.id into bad_hood from public.neighborhoods n join public.cities c on c.id=n.city_id where c.slug='varna' limit 1;
 begin insert into public.listings(slug,owner_id,type,title,description,price_eur,area_m2,rooms,available_from,city_id,neighborhood_id)
 select 'bad-city-hood-fixture',auth.uid(),'room','Невалиден квартал','Достатъчно дълъг текст само за тест на комбинирания външен ключ.',200,20,1,current_date,id,bad_hood from public.cities where slug='sofia';
 raise exception 'Mismatched neighborhood accepted'; exception when foreign_key_violation then null; end;
 select u.id into bad_uni from public.universities u join public.cities c on c.id=u.city_id where c.slug='varna' limit 1;
 begin insert into public.listings(slug,owner_id,type,title,description,price_eur,area_m2,rooms,available_from,city_id,nearby_university_ids)
 select 'bad-city-uni-fixture',auth.uid(),'room','Невалиден университет','Достатъчно дълъг текст само за тест на университета в друг град.',200,20,1,current_date,id,array[bad_uni] from public.cities where slug='sofia';
 raise exception 'Mismatched university accepted'; exception when check_violation then null; end;
 begin insert into public.listings(slug,owner_id,type,title,description,price_eur,area_m2,rooms,available_from,city_id)
 select 'public-phone-fixture',auth.uid(),'room','Телефон в публичен текст','Публичното описание не трябва да съдържа телефон +359 888 123 456.',200,20,1,current_date,id from public.cities where slug='sofia';
 raise exception 'Public phone accepted'; exception when check_violation then null; end;
 begin perform public.moderate_listing('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','Опит за самостоятелно одобрение'); raise exception 'Owner self-approval allowed'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 begin perform public.ensure_my_profile('Непотвърден','tenant'); raise exception 'Unverified profile allowed'; exception when insufficient_privilege then null; end;
 begin perform * from public.get_listing_contact('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'); raise exception 'Unverified contact allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: anonymous access, search, contacts, favorites, messages, location constraints; all fixtures rolled back' as result;
