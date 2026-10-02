-- Reference provenance, immutable city/neighborhood relationships and private communication.
alter table public.cities add column ekatte text unique, add column region text, add column is_university_city boolean not null default false, add column source_url text;
alter table public.neighborhoods add column source_url text, add column source_ref text, add column association_method text;
alter table public.universities add column source_url text, add column kind text not null default 'institution' check(kind in ('institution','branch'));
alter table public.listings add column nearby_university_ids uuid[] not null default '{}';
alter table public.listings add constraint floor_consistency check(total_floors is null or floor is null or floor <= total_floors);

-- Anonymous visitors never receive profile names or contact rows.
revoke select on public.profiles from anon;
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(private.can_read_profile(id));
create table private.contact_access (
 viewer_id uuid not null references public.profiles(id), listing_id uuid not null references public.listings(id),
 accessed_on date not null default current_date, created_at timestamptz not null default now(), primary key(viewer_id,listing_id,accessed_on)
);
alter table private.contact_access enable row level security;
revoke all on private.contact_access from public,anon,authenticated;
create index contact_access_listing_idx on private.contact_access(listing_id);

create table public.conversations (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id),
 owner_id uuid not null references public.profiles(id), tenant_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(listing_id,tenant_id), check(owner_id <> tenant_id)
);
create index conversations_owner_idx on public.conversations(owner_id,updated_at desc);
create index conversations_tenant_idx on public.conversations(tenant_id,updated_at desc);
create table public.messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
 sender_id uuid not null references public.profiles(id), body text not null check(char_length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages(conversation_id,created_at,id);
create index messages_sender_idx on public.messages(sender_id,created_at);
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
revoke all on public.conversations,public.messages from public,anon,authenticated;
grant all on public.conversations,public.messages to service_role;
grant select on public.conversations,public.messages to authenticated;
create policy conversations_read on public.conversations for select to authenticated using((select private.is_active_user()) and (owner_id=(select auth.uid()) or tenant_id=(select auth.uid())));
create policy messages_read on public.messages for select to authenticated using((select private.is_active_user()) and exists(select 1 from public.conversations c where c.id=conversation_id and auth.uid() in (c.owner_id,c.tenant_id)));

create or replace function private.is_active_user() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles p join auth.users u on u.id=p.id
 where p.id=auth.uid() and p.status='active' and not coalesce(u.is_anonymous,false) and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null));
$$;
create or replace function private.can_read_profile(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active_user() and (p_id=auth.uid() or private.is_staff()
 or exists(select 1 from public.listings where owner_id=p_id and private.listing_is_public(id))
 or exists(select 1 from public.conversations where auth.uid() in (owner_id,tenant_id) and p_id in (owner_id,tenant_id)));
$$;
create function private.get_listing_contact(p_listing_id uuid) returns table(display_name text,phone text,email text) language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active_user() then raise insufficient_privilege using message='Влез в потвърден акаунт за контакт.'; end if;
 if not private.listing_is_public(p_listing_id) and not private.owns_listing(p_listing_id) then raise no_data_found using message='Обявата не е достъпна.'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if not exists(select 1 from private.contact_access where viewer_id=auth.uid() and listing_id=p_listing_id and accessed_on=current_date)
 and (select count(*) from private.contact_access where viewer_id=auth.uid() and accessed_on=current_date)>=30 then raise check_violation using message='Дневният лимит за показване на контакти е достигнат.'; end if;
 insert into private.contact_access(viewer_id,listing_id) values(auth.uid(),p_listing_id) on conflict do nothing;
 return query select p.name,case when pc.phone_verified then pc.phone else null end,case when pc.email_verified then pc.email else null end
 from public.listings l join public.profiles p on p.id=l.owner_id join public.profile_contacts pc on pc.id=p.id where l.id=p_listing_id and p.status='active';
end; $$;
create function public.get_listing_contact(p_listing_id uuid) returns table(display_name text,phone text,email text) language sql security invoker set search_path='' as $$ select * from private.get_listing_contact(p_listing_id); $$;
revoke all on function public.get_listing_contact(uuid),private.get_listing_contact(uuid) from public,anon;
grant execute on function public.get_listing_contact(uuid),private.get_listing_contact(uuid) to authenticated;

create function private.start_conversation(p_listing_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare lid uuid; oid uuid; cid uuid;
begin
 if not private.is_active_user() then raise insufficient_privilege; end if;
 select id,owner_id into lid,oid from public.listings where id=p_listing_id and status='active' and private.listing_is_public(id);
 if lid is null then raise no_data_found using message='Обявата вече не е активна.'; end if;
 if oid=auth.uid() then raise check_violation using message='Това е твоята обява.'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 select id into cid from public.conversations where listing_id=lid and tenant_id=auth.uid();
 if cid is not null then return cid; end if;
 if (select count(*) from public.conversations where tenant_id=auth.uid() and created_at>now()-interval '1 day')>=10 then raise check_violation using message='Можеш да започнеш до 10 нови разговора на ден.'; end if;
 insert into public.conversations(listing_id,owner_id,tenant_id) values(lid,oid,auth.uid()) returning id into cid;
 return cid;
end; $$;
create function public.start_conversation(p_listing_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.start_conversation(p_listing_id); $$;
revoke all on function public.start_conversation(uuid),private.start_conversation(uuid) from public,anon;
grant execute on function public.start_conversation(uuid),private.start_conversation(uuid) to authenticated;

create function private.send_message(p_conversation_id uuid,p_body text,p_request_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.conversations; mid uuid;
begin
 if not private.is_active_user() then raise insufficient_privilege; end if;
 select * into c from public.conversations where id=p_conversation_id;
 if c.id is null or auth.uid() not in (c.owner_id,c.tenant_id) then raise insufficient_privilege; end if;
 if exists(select 1 from public.profiles where id in (c.owner_id,c.tenant_id) and status<>'active') then raise insufficient_privilege; end if;
 if p_request_id is null or p_body is null or char_length(trim(p_body)) not between 1 and 2000 then raise invalid_parameter_value; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if exists(select 1 from public.messages where id=p_request_id and sender_id=auth.uid() and conversation_id=c.id and body=trim(p_body)) then return p_request_id; end if;
 if (select count(*) from public.messages where sender_id=auth.uid() and created_at>now()-interval '1 minute')>=20
 or (select count(*) from public.messages where sender_id=auth.uid() and created_at>now()-interval '1 day')>=200 then raise check_violation using message='Достигнат е лимитът за съобщения. Опитай по-късно.'; end if;
 insert into public.messages(id,conversation_id,sender_id,body) values(p_request_id,c.id,auth.uid(),trim(p_body)) returning id into mid;
 update public.conversations set updated_at=now() where id=c.id;
 return mid;
end; $$;
create function public.send_message(p_conversation_id uuid,p_body text,p_request_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.send_message(p_conversation_id,p_body,p_request_id); $$;
revoke all on function public.send_message(uuid,text,uuid),private.send_message(uuid,text,uuid) from public,anon;
grant execute on function public.send_message(uuid,text,uuid),private.send_message(uuid,text,uuid) to authenticated;

-- No public phone/email in listing text; clients cannot bypass this check.
create function private.validate_listing_location() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if coalesce(array_length(new.nearby_university_ids,1),0)>3 then raise check_violation using message='Избери до 3 университета.'; end if;
 if exists(select 1 from unnest(new.nearby_university_ids) u where not exists(select 1 from public.universities v where v.id=u and v.city_id=new.city_id)) then raise check_violation using message='Университетът трябва да е в избрания град.'; end if;
 if (new.title||' '||new.description) ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}' or (new.title||' '||new.description) ~ '(\+?359|00359|0)[ -]?[0-9]([ ()-]*[0-9]){7,8}' then raise check_violation using message='Телефон и имейл се показват чрез защитения контакт; премахни ги от текста.'; end if;
 return new;
end; $$;
create trigger listing_location_guard before insert or update of city_id,neighborhood_id,nearby_university_ids,title,description on public.listings for each row execute function private.validate_listing_location();
revoke all on function private.validate_listing_location() from public,anon,authenticated;
grant insert(nearby_university_ids) on public.listings to authenticated;

-- Storage objects linked to a reviewed photo cannot be replaced or removed directly.
drop policy listing_objects_delete on storage.objects;
create policy listing_objects_delete on storage.objects for delete to authenticated using(bucket_id='listing-photos' and private.can_upload_photo(name) and not exists(select 1 from public.listing_photos where storage_path=name));
drop policy listing_objects_insert on storage.objects;
create policy listing_objects_insert on storage.objects for insert to authenticated with check(bucket_id='listing-photos' and private.can_upload_photo(name) and not exists(select 1 from public.listing_photos where storage_path=name));

-- Server filtering returns bounded IDs and a total, including the empty-page case.
create function public.search_listing_ids(p_filters jsonb default '{}',p_sort text default 'newest',p_page integer default 1,p_size integer default 18) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_page is null or p_page<1 or p_page>10000 or p_size is null or p_size<1 or p_size>50 then raise invalid_parameter_value; end if;
 if p_filters is null or jsonb_typeof(p_filters)<>'object' or char_length(p_filters::text)>2000 then raise invalid_parameter_value; end if;
 if p_sort is null or p_sort not in ('newest','relevance','cheapest','pricePerM2') then raise invalid_parameter_value; end if;
 if p_filters ? 'rooms' and jsonb_typeof(p_filters->'rooms')<>'array' then raise invalid_parameter_value; end if;
 if coalesce(jsonb_array_length(p_filters->'rooms'),0)>10 or char_length(coalesce(p_filters->>'text',''))>200 then raise invalid_parameter_value; end if;
 if coalesce(p_filters->>'type','all') not in ('all','apartment','room','studio','house') then raise invalid_parameter_value; end if;
 if (p_filters->>'priceMin')::numeric < 0 or (p_filters->>'priceMax')::numeric < 0
 or (p_filters->>'areaMin')::numeric < 0 or (p_filters->>'areaMax')::numeric < 0
 or (p_filters->>'priceMin')::numeric > (p_filters->>'priceMax')::numeric
 or (p_filters->>'areaMin')::numeric > (p_filters->>'areaMax')::numeric
 or (p_filters->>'floorMin')::int > (p_filters->>'floorMax')::int then raise invalid_parameter_value using message='Провери диапазоните на филтрите.'; end if;
 with candidates as (
 select l.id,l.created_at,l.price_eur,l.area_m2,(select count(*) from public.listing_photos p where p.listing_id=l.id) photo_count from public.listings l join public.cities c on c.id=l.city_id left join public.neighborhoods n on n.id=l.neighborhood_id
 where l.status='active' and l.expires_at>now() and l.verification_expires_at>now()
 and (coalesce(p_filters->>'citySlug','')='' or c.slug=p_filters->>'citySlug')
 and (coalesce(p_filters->>'neighborhoodSlug','')='' or n.slug=p_filters->>'neighborhoodSlug')
 and (coalesce(p_filters->>'universitySlug','')='' or exists(select 1 from public.universities u where u.city_id=l.city_id and u.slug=p_filters->>'universitySlug' and u.id=any(l.nearby_university_ids)))
 and (coalesce(p_filters->>'type','all')='all' or l.type=p_filters->>'type')
 and ((p_filters->>'priceMin') is null or l.price_eur >= (p_filters->>'priceMin')::numeric)
 and ((p_filters->>'priceMax') is null or l.price_eur <= (p_filters->>'priceMax')::numeric)
 and ((p_filters->>'areaMin') is null or l.area_m2 >= (p_filters->>'areaMin')::numeric)
 and ((p_filters->>'areaMax') is null or l.area_m2 <= (p_filters->>'areaMax')::numeric)
 and ((p_filters->>'floorMin') is null or l.floor >= (p_filters->>'floorMin')::integer)
 and ((p_filters->>'floorMax') is null or l.floor <= (p_filters->>'floorMax')::integer)
 and ((p_filters->>'furnished') is null or l.furnished=(p_filters->>'furnished')::boolean)
 and ((p_filters->>'petsAllowed') is null or l.pets_allowed=(p_filters->>'petsAllowed')::boolean)
 and (coalesce(p_filters->>'availableFrom','')='' or l.available_from <= (p_filters->>'availableFrom')::date)
 and ((coalesce(jsonb_array_length(p_filters->'rooms'),0)=0 and (p_filters->>'roomsMin') is null)
 or exists(select 1 from jsonb_array_elements_text(p_filters->'rooms') as room(value) where room.value::int=l.rooms)
 or ((p_filters->>'roomsMin') is not null and l.rooms >= (p_filters->>'roomsMin')::int))
 and (coalesce(p_filters->>'text','')='' or strpos(lower(l.title||' '||l.description||' '||c.name||' '||coalesce(n.name,'')),lower(p_filters->>'text'))>0)
 ), ranked as (select *,row_number() over(order by case when p_sort='relevance' then least(photo_count,5) end desc,case when p_sort='cheapest' then price_eur end asc,case when p_sort='pricePerM2' then price_eur/area_m2 end asc,created_at desc,id) ord from candidates), totals as (select count(*) n from candidates)
 select jsonb_build_object('ids',coalesce((select jsonb_agg(id order by ord) from ranked where ord > (least(p_page,greatest(1,ceil(totals.n::numeric/p_size)::int))-1)*p_size and ord <= least(p_page,greatest(1,ceil(totals.n::numeric/p_size)::int))*p_size),'[]'::jsonb),'total',totals.n,'page',least(p_page,greatest(1,ceil(totals.n::numeric/p_size)::int))) into result from totals;
 return result;
end; $$;
revoke all on function public.search_listing_ids(jsonb,text,integer,integer) from public;
grant execute on function public.search_listing_ids(jsonb,text,integer,integer) to anon,authenticated;
create index listings_public_search_idx on public.listings(status,city_id,neighborhood_id,price_eur,created_at desc);
create index listings_universities_idx on public.listings using gin(nearby_university_ids);
-- Serialize per-account creation and apply explicit abuse limits rather than a demo quota.
create or replace function private.guard_listing_insert() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or new.owner_id<>auth.uid() or not private.is_active_user() then raise insufficient_privilege; end if;
 perform 1 from public.profiles where id=auth.uid() and role in ('owner','admin') for update;
 if not found then raise insufficient_privilege using message='Нужен е профил на собственик.'; end if;
 if new.status not in ('draft','pending_review') then raise insufficient_privilege using message='Обявата изисква преглед.'; end if;
 if (select count(*) from public.listings where owner_id=auth.uid() and status not in ('removed','rented'))>=20 then
 raise check_violation using message='Лимитът е 20 незавършени обяви. Свържи се с екипа за повече имоти.'; end if;
 if (select count(*) from public.listings where owner_id=auth.uid() and created_at>now()-interval '1 day')>=5 then
 raise check_violation using message='Можеш да създадеш до 5 обяви на ден.'; end if;
 return new;
end; $$;

create function private.enable_owner_profile() returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active_user() then raise insufficient_privilege; end if;
 update public.profiles set role='owner' where id=auth.uid() and role='tenant';
 insert into private.audit_events(actor_id,action,entity_id,reason) values(auth.uid(),'profile.enable_owner',auth.uid(),'Потребителят избра публикуване като собственик. Това не е проверка на собственост.');
end; $$;
create function public.enable_owner_profile() returns void language sql security invoker set search_path='' as $$ select private.enable_owner_profile(); $$;
revoke all on function public.enable_owner_profile(),private.enable_owner_profile() from public,anon;
grant execute on function public.enable_owner_profile(),private.enable_owner_profile() to authenticated;

-- One transaction either saves the full photo order or saves nothing.
create function private.reorder_listing_photos(p_listing_id uuid,p_photo_ids uuid[]) returns void language plpgsql security definer set search_path='' as $$
declare expected integer;
begin
 if not private.can_edit_photos(p_listing_id) then raise insufficient_privilege; end if;
 perform 1 from public.listings where id=p_listing_id for update;
 select count(*) into expected from public.listing_photos where listing_id=p_listing_id;
 if p_photo_ids is null or cardinality(p_photo_ids)<>expected or expected>15
 or (select count(distinct id) from unnest(p_photo_ids) as photo(id))<>expected
 or exists(select 1 from unnest(p_photo_ids) as photo(id) where not exists(select 1 from public.listing_photos p where p.id=photo.id and p.listing_id=p_listing_id)) then raise invalid_parameter_value using message='Списъкът със снимки е променен. Обнови и опитай отново.'; end if;
 update public.listing_photos p set position=photo.ord-1 from unnest(p_photo_ids) with ordinality as photo(id,ord) where p.id=photo.id and p.listing_id=p_listing_id;
end; $$;
create function public.reorder_listing_photos(p_listing_id uuid,p_photo_ids uuid[]) returns void language sql security invoker set search_path='' as $$ select private.reorder_listing_photos(p_listing_id,p_photo_ids); $$;
revoke all on function public.reorder_listing_photos(uuid,uuid[]),private.reorder_listing_photos(uuid,uuid[]) from public,anon;
grant execute on function public.reorder_listing_photos(uuid,uuid[]),private.reorder_listing_photos(uuid,uuid[]) to authenticated;

-- Contact records are synchronized only from verified Supabase Auth fields.
create or replace function private.ensure_my_profile(p_name text,p_role text) returns void language plpgsql security definer set search_path='' as $$
declare u auth.users;
begin
 if auth.uid() is null then raise insufficient_privilege using message='Нужен е вход.'; end if;
 if p_role not in ('tenant','owner') or p_role is null then raise invalid_parameter_value using message='Недопустима роля.'; end if;
 select * into strict u from auth.users where id=auth.uid();
 if coalesce(u.is_anonymous,false) or (u.email_confirmed_at is null and u.phone_confirmed_at is null) then raise insufficient_privilege using message='Потвърди имейла или телефона си.'; end if;
 insert into public.profiles(id,name,role) values(u.id,coalesce(nullif(left(trim(p_name),100),''),'Потребител'),p_role) on conflict(id) do nothing;
 if not private.is_active_user() then raise insufficient_privilege; end if;
 insert into public.profile_contacts(id,phone,email,phone_verified,email_verified)
 values(u.id,case when u.phone_confirmed_at is not null then nullif(u.phone,'') else null end,
 case when u.email_confirmed_at is not null then u.email else null end,u.phone_confirmed_at is not null,u.email_confirmed_at is not null)
 on conflict(id) do update set phone=excluded.phone,email=excluded.email,phone_verified=excluded.phone_verified,email_verified=excluded.email_verified;
end; $$;
