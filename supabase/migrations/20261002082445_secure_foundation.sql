-- Fresh-project foundation. No demo users, listings, photos or testimonials.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 100),
 role text not null default 'tenant' check (role in ('tenant','owner','moderator','admin')),
 status text not null default 'active' check (status in ('active','suspended','banned')),
 owner_verified boolean not null default false,
 trust_score integer not null default 0 check (trust_score between 0 and 100),
 created_at timestamptz not null default now()
);
create table public.profile_contacts (
 id uuid primary key references public.profiles(id) on delete cascade,
 phone text, email text, phone_verified boolean not null default false,
 email_verified boolean not null default false
);
create table public.cities (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
 lat double precision, lng double precision
);
create table public.neighborhoods (
 id uuid primary key default gen_random_uuid(), city_id uuid not null references public.cities(id),
 slug text not null, name text not null, lat double precision, lng double precision,
 unique(city_id,slug), unique(id,city_id)
);
create table public.universities (
 id uuid primary key default gen_random_uuid(), city_id uuid not null references public.cities(id),
 slug text not null, name text not null, lat double precision, lng double precision,
 unique(city_id,slug)
);
create table public.listings (
 id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9-]{1,100}$'),
 owner_id uuid not null references public.profiles(id),
 type text not null check (type in ('apartment','room','studio','house')),
 status text not null default 'pending_review' check (status in ('draft','pending_review','active','rented','expired','deactivated','rejected','flagged','removed')),
 title text not null check (char_length(title) between 5 and 120),
 description text not null check (char_length(description) between 30 and 5000),
 price_eur numeric(10,2) not null check (price_eur > 0), deposit numeric(10,2) check (deposit >= 0),
 area_m2 numeric(8,2) not null check (area_m2 > 0), rooms integer not null check (rooms between 1 and 100),
 floor integer check (floor between -5 and 200), total_floors integer check (total_floors between 1 and 200),
 furnished boolean not null default false, pets_allowed boolean not null default false,
 utilities_included boolean not null default false, available_from date not null,
 min_term_months integer not null default 1 check (min_term_months between 1 and 120),
 city_id uuid not null references public.cities(id), neighborhood_id uuid,
 foreign key(neighborhood_id,city_id) references public.neighborhoods(id,city_id),
 lat_approx double precision, lng_approx double precision,
 created_at timestamptz not null default now(), expires_at timestamptz, rented_at timestamptz,
 ownership_verified_at timestamptz, verification_expires_at timestamptz,
 verification_method text check (verification_method in ('document_review','in_person')),
 check (status <> 'active' or (expires_at is not null and ownership_verified_at is not null and verification_expires_at is not null))
);
-- Exact addresses are never part of a public listing row.
create table public.listing_private_details (
 listing_id uuid primary key references public.listings(id) on delete cascade,
 address text not null check (char_length(address) between 1 and 500)
);
create table public.listing_photos (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
 storage_path text not null unique, position integer not null check (position between 0 and 14),
 phash text not null default '', created_at timestamptz not null default now()
);
create table public.favorites (
 user_id uuid not null references public.profiles(id) on delete cascade,
 listing_id uuid not null references public.listings(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,listing_id)
);
create table public.listing_views (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
 viewer_id uuid not null references public.profiles(id) on delete cascade,
 viewed_on date not null default (now() at time zone 'UTC')::date,
 created_at timestamptz not null default now(), unique(listing_id,viewer_id,viewed_on)
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), listing_id uuid references public.listings(id),
 reporter_id uuid not null references public.profiles(id),
 reason text not null check (reason in ('broker','fake','rented','already_rented','wrong_info','wrong_price','other')),
 details text not null check (char_length(details) between 10 and 2000), listing_url text,
 status text not null default 'open' check(status in ('open','resolved','dismissed')),
 resolved_by uuid references public.profiles(id), resolution_note text,
 created_at timestamptz not null default now(), resolved_at timestamptz
);
create unique index reports_one_open_per_user_listing on public.reports(reporter_id,listing_id) where status='open' and listing_id is not null;
create table private.audit_events (
 id bigint generated always as identity primary key, actor_id uuid,
 action text not null, entity_id uuid, reason text not null, metadata jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create table private.verification_reviews (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id),
 reviewed_by uuid not null references public.profiles(id), method text not null,
 evidence_reference text not null, created_at timestamptz not null default now()
);
create index listings_owner_idx on public.listings(owner_id);
create index listings_browse_idx on public.listings(city_id,status,created_at desc);
create index listings_neighborhood_idx on public.listings(neighborhood_id);
create index photos_listing_idx on public.listing_photos(listing_id);
create index favorites_listing_idx on public.favorites(listing_id);
create index views_viewer_idx on public.listing_views(viewer_id);
create index reports_queue_idx on public.reports(status,created_at);
create index reports_listing_idx on public.reports(listing_id);
create index reports_resolver_idx on public.reports(resolved_by);
create index reviews_listing_idx on private.verification_reviews(listing_id);
create index reviews_reviewer_idx on private.verification_reviews(reviewed_by);

-- Privileged implementations are outside exposed schemas; each entry validates the caller.
create function private.is_active_user() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles p join auth.users u on u.id=p.id
 where p.id=auth.uid() and p.status='active' and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null));
$$;
create function private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.is_active_user() and coalesce(auth.jwt()->>'aal','')='aal2'
 and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'));
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_staff() and exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create function private.listing_is_public(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.listings l join public.profiles p on p.id=l.owner_id where l.id=p_id and p.status='active'
 and l.verification_expires_at>now() and ((l.status='active' and l.expires_at>now()) or (l.status='rented' and l.rented_at>now()-interval '7 days')));
$$;
create function private.owns_listing(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.is_active_user() and exists(select 1 from public.listings where id=p_id and owner_id=auth.uid());
$$;
create function private.can_edit_photos(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.owns_listing(p_id) and exists(select 1 from public.listings where id=p_id and status in ('draft','pending_review','rejected','deactivated','expired'));
$$;
create function private.can_read_profile(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_id=auth.uid() or private.is_staff() or exists(select 1 from public.listings where owner_id=p_id and private.listing_is_public(id));
$$;
create function private.can_read_photo(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.listing_photos p where p.storage_path=p_path and (private.listing_is_public(p.listing_id) or private.owns_listing(p.listing_id) or private.is_staff()))
 or (auth.uid() is not null and split_part(p_path,'/',1)=auth.uid()::text and exists(select 1 from public.listings where id::text=split_part(p_path,'/',2) and private.owns_listing(id)));
$$;
create function private.can_upload_photo(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and split_part(p_path,'/',1)=auth.uid()::text
 and p_path ~ '^[a-f0-9-]+/[a-f0-9-]+/[a-f0-9-]+\.(jpg|png|webp)$'
 and exists(select 1 from public.listings where id::text=split_part(p_path,'/',2) and private.can_edit_photos(id));
$$;

create function private.ensure_my_profile(p_name text,p_role text) returns void language plpgsql security definer set search_path='' as $$
declare u auth.users;
begin
 if auth.uid() is null then raise insufficient_privilege using message='Нужен е вход.'; end if;
 if p_role not in ('tenant','owner') or p_role is null then raise invalid_parameter_value using message='Недопустима роля.'; end if;
 select * into strict u from auth.users where id=auth.uid();
 if u.email_confirmed_at is null and u.phone_confirmed_at is null then raise insufficient_privilege using message='Потвърдете имейла или телефона си.'; end if;
 insert into public.profiles(id,name,role) values(u.id,coalesce(nullif(left(trim(p_name),100),''),'Потребител'),p_role) on conflict(id) do nothing;
 insert into public.profile_contacts(id,phone,email,phone_verified,email_verified)
 values(u.id,nullif(u.phone,''),u.email,u.phone_confirmed_at is not null,u.email_confirmed_at is not null)
 on conflict(id) do update set phone=excluded.phone,email=excluded.email,phone_verified=excluded.phone_verified,email_verified=excluded.email_verified;
end; $$;

create function private.guard_listing_insert() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or new.owner_id<>auth.uid() or not private.is_active_user() then raise insufficient_privilege; end if;
 perform 1 from public.profiles where id=auth.uid() and role in ('owner','admin') for update;
 if not found then raise insufficient_privilege using message='Нужен е профил на собственик.'; end if;
 if new.status not in ('draft','pending_review') then raise insufficient_privilege using message='Обявата изисква преглед.'; end if;
 if (select count(*) from public.listings where owner_id=auth.uid() and status not in ('removed','rented'))>=2 then
 raise check_violation using message='Пилотът допуска до две незавършени обяви на собственик.'; end if;
 return new;
end; $$;
create trigger listing_insert_guard before insert on public.listings for each row execute function private.guard_listing_insert();

create function private.guard_photo() returns trigger language plpgsql security definer set search_path='' as $$
declare lid uuid; path text;
begin
 lid:=case when TG_OP='DELETE' then old.listing_id else new.listing_id end;
 if auth.uid() is null or not private.can_edit_photos(lid) then raise insufficient_privilege using message='Деактивирайте обявата преди промяна на снимките.'; end if;
 perform 1 from public.listings where id=lid for update;
 if TG_OP='INSERT' then
  if not private.can_upload_photo(new.storage_path) or split_part(new.storage_path,'/',2)<>lid::text
    or not exists(select 1 from storage.objects where bucket_id='listing-photos' and name=new.storage_path) then raise check_violation using message='Снимката трябва да е качена към тази обява.'; end if;
  if (select count(*) from public.listing_photos where listing_id=lid)>=15 then raise check_violation using message='Максимум 15 снимки.'; end if;
 end if;
 -- Any photo edit invalidates the review for this particular listing.
 update public.listings set ownership_verified_at=null,verification_expires_at=null,verification_method=null where id=lid;
 insert into private.audit_events(actor_id,action,entity_id,reason) values(auth.uid(),'photo.'||lower(TG_OP),lid,'Промяна на снимки; проверката е анулирана.');
 if TG_OP='DELETE' then return old; end if; return new;
end; $$;
create trigger photo_guard before insert or update or delete on public.listing_photos for each row execute function private.guard_photo();

create function private.owner_set_listing_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare l public.listings;
begin
 if not private.owns_listing(p_id) then raise insufficient_privilege; end if;
 select * into strict l from public.listings where id=p_id for update;
 if not ((l.status='active' and p_status in ('rented','deactivated')) or
 (l.status in ('draft','expired','deactivated','rejected') and p_status='pending_review') or
 (l.status='pending_review' and p_status='deactivated')) then raise check_violation using message='Недопустима промяна на статуса.'; end if;
 update public.listings set status=p_status,rented_at=case when p_status='rented' then now() else null end where id=p_id;
 insert into private.audit_events(actor_id,action,entity_id,reason,metadata) values(auth.uid(),'listing.owner_status',p_id,'Промяна от собственик',jsonb_build_object('from',l.status,'to',p_status));
end; $$;
create function private.verify_listing(p_id uuid,p_method text,p_evidence_reference text) returns void language plpgsql security definer set search_path='' as $$
declare l public.listings;
begin
 if private.is_staff() is not true then raise insufficient_privilege using message='Нужен е модератор с двуфакторен вход.'; end if;
 if p_method not in ('document_review','in_person') or p_method is null or char_length(trim(coalesce(p_evidence_reference,''))) not between 10 and 500 then raise invalid_parameter_value using message='Посочете метод и референция към извършената проверка.'; end if;
 select * into strict l from public.listings where id=p_id for update;
 if l.owner_id=auth.uid() then raise insufficient_privilege using message='Не можете да проверявате собствен имот.'; end if;
 if l.status not in ('pending_review','flagged') then raise check_violation using message='Обявата трябва да е в преглед.'; end if;
 insert into private.verification_reviews(listing_id,reviewed_by,method,evidence_reference) values(p_id,auth.uid(),p_method,trim(p_evidence_reference));
 update public.listings set ownership_verified_at=now(),verification_expires_at=now()+interval '90 days',verification_method=p_method where id=p_id;
 insert into private.audit_events(actor_id,action,entity_id,reason) values(auth.uid(),'listing.verification',p_id,'Ръчна проверка: '||p_method);
end; $$;
create function private.moderate_listing(p_id uuid,p_status text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare l public.listings;
begin
 if private.is_staff() is not true then raise insufficient_privilege using message='Нужен е модератор с двуфакторен вход.'; end if;
 if char_length(trim(coalesce(p_reason,''))) not between 10 and 1000 then raise invalid_parameter_value using message='Нужна е причина за решението.'; end if;
 select * into strict l from public.listings where id=p_id for update;
 if l.owner_id=auth.uid() then raise insufficient_privilege using message='Не можете да одобрявате собствен имот.'; end if;
 if l.status='removed' or p_status is null or p_status not in ('active','rejected','flagged','removed') then raise check_violation; end if;
 if p_status='active' then
  if l.status not in ('pending_review','flagged') or l.verification_expires_at is null or l.verification_expires_at<=now()
   or not exists(select 1 from public.listing_photos where listing_id=p_id)
   or not exists(select 1 from public.profiles where id=l.owner_id and status='active') then raise check_violation using message='Нужни са снимки, активен собственик и валидна проверка за този имот.'; end if;
 end if;
 if p_status='rejected' and l.status not in ('pending_review','flagged') then raise check_violation; end if;
 update public.listings set status=p_status,expires_at=case when p_status='active' then now()+interval '30 days' else expires_at end where id=p_id;
 insert into private.audit_events(actor_id,action,entity_id,reason,metadata) values(auth.uid(),'listing.moderation',p_id,trim(p_reason),jsonb_build_object('from',l.status,'to',p_status));
end; $$;
create function private.admin_update_user(p_id uuid,p_role text,p_status text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if private.is_admin() is not true or p_id=auth.uid() then raise insufficient_privilege; end if;
 if char_length(trim(coalesce(p_reason,''))) not between 10 and 1000 then raise invalid_parameter_value; end if;
 if p_role is not null and p_role not in ('owner','tenant','moderator','admin') then raise invalid_parameter_value; end if;
 if p_status is not null and p_status not in ('active','suspended','banned') then raise invalid_parameter_value; end if;
 update public.profiles set role=coalesce(p_role,role),status=coalesce(p_status,status) where id=p_id;
 if not found then raise no_data_found; end if;
 insert into private.audit_events(actor_id,action,entity_id,reason,metadata) values(auth.uid(),'user.moderation',p_id,p_reason,jsonb_build_object('role',p_role,'status',p_status));
end; $$;
create function private.submit_report(p_listing_id uuid,p_reason text,p_details text,p_listing_url text) returns uuid language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin
 if not private.is_active_user() then raise insufficient_privilege using message='Влезте с потвърден профил, за да подадете сигнал.'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if (select count(*) from public.reports where reporter_id=auth.uid() and created_at>now()-interval '1 day')>=5 then raise check_violation using message='Достигнат е лимитът от 5 сигнала за 24 часа.'; end if;
 if p_listing_id is not null and not private.listing_is_public(p_listing_id) then raise insufficient_privilege; end if;
 if p_listing_url is not null and (length(p_listing_url)>1000 or p_listing_url !~ '^https://kvartiribezposrednik\.com/') then raise invalid_parameter_value using message='Посочете адрес на страница от платформата.'; end if;
 insert into public.reports(listing_id,reporter_id,reason,details,listing_url) values(p_listing_id,auth.uid(),p_reason,trim(p_details),p_listing_url) returning id into rid;
 insert into private.audit_events(actor_id,action,entity_id,reason) values(auth.uid(),'report.created',rid,'Подаден сигнал');
 return rid;
end; $$;
create function private.resolve_report(p_id uuid,p_status text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if private.is_staff() is not true then raise insufficient_privilege; end if;
 if p_status not in ('resolved','dismissed') or p_status is null or char_length(trim(coalesce(p_reason,''))) not between 10 and 1000 then raise invalid_parameter_value; end if;
 update public.reports set status=p_status,resolved_by=auth.uid(),resolved_at=now(),resolution_note=trim(p_reason) where id=p_id and status='open';
 if not found then raise check_violation using message='Сигналът не е отворен.'; end if;
 insert into private.audit_events(actor_id,action,entity_id,reason) values(auth.uid(),'report.'||p_status,p_id,trim(p_reason));
end; $$;
create function private.record_listing_view(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active_user() or not private.listing_is_public(p_id) or private.owns_listing(p_id) then return; end if;
 insert into public.listing_views(listing_id,viewer_id) values(p_id,auth.uid()) on conflict(listing_id,viewer_id,viewed_on) do nothing;
end; $$;
create function private.owner_metrics() returns table(listing_id uuid,views bigint,unique_views bigint,favorites bigint,photos bigint)
language sql stable security definer set search_path='' as $$
 select l.id,(select count(*) from public.listing_views where listing_id=l.id),
 (select count(distinct viewer_id) from public.listing_views where listing_id=l.id),
 (select count(*) from public.favorites where listing_id=l.id),(select count(*) from public.listing_photos where listing_id=l.id)
 from public.listings l where auth.uid() is not null and private.is_active_user() and l.owner_id=auth.uid();
$$;
create function private.owner_daily_metrics(p_days integer) returns table(listing_id uuid,day date,views bigint,favorites bigint)
language sql stable security definer set search_path='' as $$
 select l.id,d::date,(select count(*) from public.listing_views v where v.listing_id=l.id and v.viewed_on=d::date),
 (select count(*) from public.favorites f where f.listing_id=l.id and (f.created_at at time zone 'UTC')::date=d::date)
 from public.listings l cross join generate_series((now() at time zone 'UTC')::date-(greatest(1,least(coalesce(p_days,30),90))-1), (now() at time zone 'UTC')::date,interval '1 day') d
 where auth.uid() is not null and private.is_active_user() and l.owner_id=auth.uid();
$$;

-- RLS and explicit grants, independent of project default API exposure settings.
do $$ declare t text; begin
 foreach t in array array['profiles','profile_contacts','cities','neighborhoods','universities','listings','listing_private_details','listing_photos','favorites','listing_views','reports'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
alter table private.audit_events enable row level security;
alter table private.verification_reviews enable row level security;
revoke all on all tables in schema private from public,anon,authenticated;
grant select on private.audit_events,private.verification_reviews to authenticated;
create policy staff_audit on private.audit_events for select to authenticated using ((select private.is_staff()));
create policy staff_reviews on private.verification_reviews for select to authenticated using ((select private.is_staff()));

grant select on public.cities,public.neighborhoods,public.universities,public.listings,public.listing_photos,public.profiles to anon,authenticated;
create policy cities_read on public.cities for select to anon,authenticated using(true);
create policy neighborhoods_read on public.neighborhoods for select to anon,authenticated using(true);
create policy universities_read on public.universities for select to anon,authenticated using(true);
create policy profiles_read on public.profiles for select to anon,authenticated using(private.can_read_profile(id));
create policy listings_read on public.listings for select to anon,authenticated using(private.listing_is_public(id) or private.owns_listing(id) or (select private.is_staff()));
create policy photos_read on public.listing_photos for select to anon,authenticated using(private.listing_is_public(listing_id) or private.owns_listing(listing_id) or (select private.is_staff()));
grant select on public.profile_contacts,public.listing_private_details,public.favorites,public.listing_views,public.reports to authenticated;
create policy contacts_read on public.profile_contacts for select to authenticated using ((id=(select auth.uid()) and (select private.is_active_user())) or (select private.is_staff()));
create policy address_read on public.listing_private_details for select to authenticated using(private.owns_listing(listing_id) or (select private.is_staff()));
create policy favorites_read on public.favorites for select to authenticated using(user_id=(select auth.uid()) and (select private.is_active_user()));
create policy views_read on public.listing_views for select to authenticated using(viewer_id=(select auth.uid()) and (select private.is_active_user()));
create policy reports_read on public.reports for select to authenticated using((reporter_id=(select auth.uid()) and (select private.is_active_user())) or (select private.is_staff()));
grant insert(id,slug,owner_id,type,status,title,description,price_eur,deposit,area_m2,rooms,floor,total_floors,furnished,pets_allowed,utilities_included,available_from,min_term_months,city_id,neighborhood_id) on public.listings to authenticated;
create policy listings_insert on public.listings for insert to authenticated with check(owner_id=(select auth.uid()) and (select private.is_active_user()) and status in ('draft','pending_review'));
grant insert(id,listing_id,storage_path,position),update(position),delete on public.listing_photos to authenticated;
create policy photos_insert on public.listing_photos for insert to authenticated with check(private.can_edit_photos(listing_id));
create policy photos_update on public.listing_photos for update to authenticated using(private.can_edit_photos(listing_id)) with check(private.can_edit_photos(listing_id));
create policy photos_delete on public.listing_photos for delete to authenticated using(private.can_edit_photos(listing_id));
grant insert(user_id,listing_id),delete on public.favorites to authenticated;
create policy favorites_insert on public.favorites for insert to authenticated with check(user_id=(select auth.uid()) and (select private.is_active_user()) and private.listing_is_public(listing_id));
create policy favorites_delete on public.favorites for delete to authenticated using(user_id=(select auth.uid()) and (select private.is_active_user()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('listing-photos','listing-photos',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('verification-documents','verification-documents',false,10485760,array['application/pdf','image/jpeg','image/png']);
create policy listing_objects_read on storage.objects for select to anon,authenticated using(bucket_id='listing-photos' and private.can_read_photo(name));
create policy listing_objects_insert on storage.objects for insert to authenticated with check(bucket_id='listing-photos' and private.can_upload_photo(name));
create policy listing_objects_delete on storage.objects for delete to authenticated using(bucket_id='listing-photos' and private.can_upload_photo(name));
-- No client UPDATE/upsert of files. Documents remain closed until a reviewed upload/retention flow exists.

-- Actual city directory; coordinates deliberately unset until a sourced geocoding import.
insert into public.cities(slug,name) values ('sofia','София'),('plovdiv','Пловдив'),('varna','Варна'),('burgas','Бургас'),('ruse','Русе'),('stara-zagora','Стара Загора'),('pleven','Плевен'),('veliko-tarnovo','Велико Търново'),('shumen','Шумен'),('blagoevgrad','Благоевград'),('gabrovo','Габрово'),('svishov','Свищов');

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_active_user(),private.is_staff(),private.is_admin(),private.listing_is_public(uuid),private.owns_listing(uuid),private.can_edit_photos(uuid),private.can_read_profile(uuid),private.can_read_photo(text),private.can_upload_photo(text) to anon,authenticated;

create function public.ensure_my_profile(p_name text,p_role text) returns void language sql security invoker set search_path='' as $$ select private.ensure_my_profile(p_name,p_role); $$;
revoke all on function public.ensure_my_profile(text,text) from public,anon;
grant execute on function public.ensure_my_profile(text,text),private.ensure_my_profile(text,text) to authenticated;

create function public.owner_set_listing_status(p_id uuid,p_status text) returns void language sql security invoker set search_path='' as $$ select private.owner_set_listing_status(p_id,p_status); $$;
revoke all on function public.owner_set_listing_status(uuid,text) from public,anon;
grant execute on function public.owner_set_listing_status(uuid,text),private.owner_set_listing_status(uuid,text) to authenticated;

create function public.verify_listing(p_id uuid,p_method text,p_evidence_reference text) returns void language sql security invoker set search_path='' as $$ select private.verify_listing(p_id,p_method,p_evidence_reference); $$;
revoke all on function public.verify_listing(uuid,text,text) from public,anon;
grant execute on function public.verify_listing(uuid,text,text),private.verify_listing(uuid,text,text) to authenticated;

create function public.moderate_listing(p_id uuid,p_status text,p_reason text) returns void language sql security invoker set search_path='' as $$ select private.moderate_listing(p_id,p_status,p_reason); $$;
revoke all on function public.moderate_listing(uuid,text,text) from public,anon;
grant execute on function public.moderate_listing(uuid,text,text),private.moderate_listing(uuid,text,text) to authenticated;

create function public.admin_update_user(p_id uuid,p_role text,p_status text,p_reason text) returns void language sql security invoker set search_path='' as $$ select private.admin_update_user(p_id,p_role,p_status,p_reason); $$;
revoke all on function public.admin_update_user(uuid,text,text,text) from public,anon;
grant execute on function public.admin_update_user(uuid,text,text,text),private.admin_update_user(uuid,text,text,text) to authenticated;

create function public.submit_report(p_listing_id uuid,p_reason text,p_details text,p_listing_url text) returns uuid language sql security invoker set search_path='' as $$ select private.submit_report(p_listing_id,p_reason,p_details,p_listing_url); $$;
revoke all on function public.submit_report(uuid,text,text,text) from public,anon;
grant execute on function public.submit_report(uuid,text,text,text),private.submit_report(uuid,text,text,text) to authenticated;

create function public.resolve_report(p_id uuid,p_status text,p_reason text) returns void language sql security invoker set search_path='' as $$ select private.resolve_report(p_id,p_status,p_reason); $$;
revoke all on function public.resolve_report(uuid,text,text) from public,anon;
grant execute on function public.resolve_report(uuid,text,text),private.resolve_report(uuid,text,text) to authenticated;

create function public.record_listing_view(p_id uuid) returns void language sql security invoker set search_path='' as $$ select private.record_listing_view(p_id); $$;
revoke all on function public.record_listing_view(uuid) from public,anon;
grant execute on function public.record_listing_view(uuid),private.record_listing_view(uuid) to authenticated;

create function public.owner_metrics() returns table(listing_id uuid,views bigint,unique_views bigint,favorites bigint,photos bigint) language sql security invoker set search_path='' as $$ select * from private.owner_metrics(); $$;
revoke all on function public.owner_metrics() from public,anon;
grant execute on function public.owner_metrics(),private.owner_metrics() to authenticated;

create function public.owner_daily_metrics(p_days integer) returns table(listing_id uuid,day date,views bigint,favorites bigint) language sql security invoker set search_path='' as $$ select * from private.owner_daily_metrics(p_days); $$;
revoke all on function public.owner_daily_metrics(integer) from public,anon;
grant execute on function public.owner_daily_metrics(integer),private.owner_daily_metrics(integer) to authenticated;

notify pgrst,'reload schema';
