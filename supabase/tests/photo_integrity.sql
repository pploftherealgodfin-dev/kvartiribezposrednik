-- Metadata-only fixtures. No photo bytes are uploaded; all SQL changes roll back.
begin;
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,is_anonymous) values
 ('55555555-5555-4555-8555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated','photo-owner@example.invalid',now(),false),
 ('66666666-6666-4666-8666-666666666666','00000000-0000-0000-0000-000000000000','authenticated','authenticated','photo-outsider@example.invalid',now(),false);
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Тест снимки','owner');
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","aal":"aal1"}',true);
select public.ensure_my_profile('Тест външен','tenant');
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}',true);
insert into public.listings(id,slug,owner_id,type,title,description,price_eur,area_m2,rooms,available_from,city_id)
select 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','photo-transaction-fixture','55555555-5555-4555-8555-555555555555','studio','Тест снимки в транзакция','Проверка на неизменността и подреждането на снимките. Всички записи се връщат назад.',300,30,1,current_date,id from public.cities where slug='sofia';

-- Simulate the Storage API deletion context for transaction-only metadata fixtures.
select set_config('storage.allow_delete_query','true',true);
set local role authenticated;
insert into storage.objects(bucket_id,name) values
 ('listing-photos','55555555-5555-4555-8555-555555555555/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/77777777-7777-4777-8777-777777777777.jpg'),
 ('listing-photos','55555555-5555-4555-8555-555555555555/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/88888888-8888-4888-8888-888888888888.jpg');
insert into public.listing_photos(id,listing_id,storage_path,position) values
 ('77777777-7777-4777-8777-777777777777','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','55555555-5555-4555-8555-555555555555/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/77777777-7777-4777-8777-777777777777.jpg',0),
 ('88888888-8888-4888-8888-888888888888','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','55555555-5555-4555-8555-555555555555/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/88888888-8888-4888-8888-888888888888.jpg',1);
do $$ declare affected integer; begin
 delete from storage.objects where bucket_id='listing-photos' and name='55555555-5555-4555-8555-555555555555/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/77777777-7777-4777-8777-777777777777.jpg';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Linked photo object can be removed'; end if;
 begin update storage.objects set metadata='{"replacement":true}' where bucket_id='listing-photos' and name like '55555555-5555-4555-8555-555555555555/%'; get diagnostics affected=row_count; if affected<>0 then raise exception 'Photo bytes/metadata can be replaced'; end if; exception when insufficient_privilege then null; end;
 perform public.reorder_listing_photos('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',array['88888888-8888-4888-8888-888888888888','77777777-7777-4777-8777-777777777777']::uuid[]);
 if (select position from public.listing_photos where id='88888888-8888-4888-8888-888888888888')<>0 then raise exception 'Atomic photo reorder failed'; end if;
 begin perform public.reorder_listing_photos('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',array['77777777-7777-4777-8777-777777777777','77777777-7777-4777-8777-777777777777']::uuid[]); raise exception 'Duplicate photo reorder accepted'; exception when invalid_parameter_value then null; end;
 if (select position from public.listing_photos where id='88888888-8888-4888-8888-888888888888')<>0 then raise exception 'Invalid reorder partially saved'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 begin perform public.reorder_listing_photos('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',array['77777777-7777-4777-8777-777777777777','88888888-8888-4888-8888-888888888888']::uuid[]); raise exception 'Cross-account reorder accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}',true);
do $$ declare deleted_id uuid; begin
 delete from public.listing_photos where id='77777777-7777-4777-8777-777777777777' returning id into deleted_id;
 if deleted_id is distinct from '77777777-7777-4777-8777-777777777777'::uuid then raise exception 'Photo DELETE RETURNING did not confirm the row'; end if;
end $$;
-- Simulates database metadata cleanup performed internally by Storage API.
select set_config('storage.allow_delete_query','true',true);
delete from storage.objects where bucket_id='listing-photos' and name='55555555-5555-4555-8555-555555555555/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/77777777-7777-4777-8777-777777777777.jpg';
do $$ begin
 if exists(select 1 from storage.objects where bucket_id='listing-photos' and name='55555555-5555-4555-8555-555555555555/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/77777777-7777-4777-8777-777777777777.jpg') then raise exception 'Unlinked object cleanup failed'; end if;
end $$;
reset role;
rollback;
select 'PASS: linked objects immutable, photo order atomic, foreign owner denied, unlink cleanup allowed; all fixtures rolled back' as result;
