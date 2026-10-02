-- UI publishing contract under the authenticated role. No email/SMS or file bytes.
-- All fixture accounts, listings and Storage metadata are rolled back.
begin;
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,is_anonymous)
values ('99999999-9999-4999-8999-999999999999','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ux-publishing@example.invalid',now(),false);
select set_config('request.jwt.claims','{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated","aal":"aal1"}',true);
set local role authenticated;
select public.ensure_my_profile('UX транзакционен тест','tenant');
do $$ begin
 if (select role from public.profiles where id=auth.uid())<>'tenant' then raise exception 'Tenant start failed'; end if;
 perform public.enable_owner_profile();
 if (select role from public.profiles where id=auth.uid())<>'owner' then raise exception 'Owner publishing opt-in failed'; end if;
end $$;
insert into public.listings(id,slug,owner_id,type,status,title,description,price_eur,area_m2,rooms,city_id,neighborhood_id,nearby_university_ids,available_from,deposit,floor,total_floors,furnished,pets_allowed,utilities_included)
select 'abababab-abab-4bab-8bab-abababababab','ux-publication-transaction',auth.uid(),'studio','pending_review','Светло студио за тест на UX','Реален договор на формата за качване: град, учебна локация, условия и снимка. Този тест се връща назад.',450.50,38,1,c.id,
 (select n.id from public.neighborhoods n where n.city_id=c.id order by n.slug limit 1),
 array[(select u.id from public.universities u where u.city_id=c.id order by u.slug limit 1)],current_date,0,0,5,true,false,false
from public.cities c where c.slug='sofia';
insert into storage.objects(bucket_id,name)
values ('listing-photos','99999999-9999-4999-8999-999999999999/abababab-abab-4bab-8bab-abababababab/acacacac-acac-4cac-8cac-acacacacacac.webp');
insert into public.listing_photos(listing_id,storage_path,position)
values ('abababab-abab-4bab-8bab-abababababab','99999999-9999-4999-8999-999999999999/abababab-abab-4bab-8bab-abababababab/acacacac-acac-4cac-8cac-acacacacacac.webp',0);
do $$ begin
 if not exists(select 1 from public.listings where id='abababab-abab-4bab-8bab-abababababab' and status='pending_review' and floor=0 and deposit=0 and price_eur=450.50) then raise exception 'Wizard listing persistence failed'; end if;
 if not exists(select 1 from public.listing_photos where listing_id='abababab-abab-4bab-8bab-abababababab' and position=0) then raise exception 'Cover photo metadata failed'; end if;
 begin perform public.moderate_listing('abababab-abab-4bab-8bab-abababababab','active','Опит за собствено одобрение'); raise exception 'Owner approved own listing'; exception when insufficient_privilege then null; end;
end $$;
-- City-only editing uses the same listing and needs neither optional location filter.
select public.owner_edit_listing('abababab-abab-4bab-8bab-abababababab',jsonb_build_object(
 'title','Стая с град без квартал','description','Градът е достатъчен за обява. Кварталът и университетът са по желание.',
 'type','room','price_eur',250,'area_m2',20,'rooms',1,'city_id',(select id from public.cities where slug='plovdiv'),
 'neighborhood_id',null,'nearby_university_ids','[]'::jsonb,'available_from',current_date,'furnished',true,'pets_allowed',false,'utilities_included',false
),'aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae');
do $$ begin
 if not exists(select 1 from public.listings where id='abababab-abab-4bab-8bab-abababababab' and neighborhood_id is null and nearby_university_ids='{}') then raise exception 'Optional location contract failed'; end if;
 if (select count(*) from public.listings where owner_id=auth.uid())<>1 then raise exception 'Edit duplicated the listing'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 if exists(select 1 from public.listings where id in ('abababab-abab-4bab-8bab-abababababab','adadadad-adad-4dad-8dad-adadadadadad')) then raise exception 'Unreviewed listing leaked to guests'; end if;
 if exists(select 1 from public.listing_photos where listing_id='abababab-abab-4bab-8bab-abababababab') then raise exception 'Pending photo leaked to guests'; end if;
end $$;
reset role;
rollback;
select 'PASS: tenant opt-in, publishing, optional locations, cover photo metadata and review gate; fixtures rolled back' as result;
