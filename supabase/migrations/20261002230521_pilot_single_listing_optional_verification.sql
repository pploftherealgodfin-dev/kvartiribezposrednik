-- Pilot: one current listing per account. A removed listing is retained as history.
-- Document verification is optional; photo, active-user, staff MFA and review gates remain.
-- No existing account, listing, photo, or verification is modified by this migration.
create unique index listings_one_current_per_owner on public.listings(owner_id) where status <> 'removed';

alter table public.listings drop constraint listings_check;
alter table public.listings add constraint listings_active_has_expiry check (status <> 'active' or expires_at is not null);

create or replace function private.guard_listing_insert() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or new.owner_id<>auth.uid() or not private.is_active_user() then raise insufficient_privilege; end if;
 perform 1 from public.profiles where id=auth.uid() and role in ('owner','admin') for update;
 if not found then raise insufficient_privilege using message='Нужен е профил на собственик.'; end if;
 if new.status not in ('draft','pending_review') then raise insufficient_privilege using message='Обявата изисква преглед.'; end if;
 if exists(select 1 from public.listings where owner_id=auth.uid() and status<>'removed') then
  raise check_violation using message='В пилотния режим всеки акаунт има една обява. Редактирай съществуващата в „Моите обяви“.';
 end if;
 if (select count(*) from public.listings where owner_id=auth.uid() and created_at>now()-interval '1 day')>=5 then
  raise check_violation using message='Достигнат е дневният лимит. Свържи се с екипа.';
 end if;
 return new;
end; $$;

create or replace function private.listing_is_public(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.listings l join public.profiles p on p.id=l.owner_id where l.id=p_id and p.status='active'
 and ((l.status='active' and l.expires_at>now()) or (l.status='rented' and l.rented_at>now()-interval '7 days')));
$$;

create or replace function private.moderate_listing(p_id uuid,p_status text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare l public.listings;
begin
 if private.is_staff() is not true then raise insufficient_privilege using message='Нужен е модератор с двуфакторен вход.'; end if;
 if char_length(trim(coalesce(p_reason,''))) not between 10 and 1000 then raise invalid_parameter_value using message='Нужна е причина за решението.'; end if;
 select * into strict l from public.listings where id=p_id for update;
 if l.owner_id=auth.uid() then raise insufficient_privilege using message='Не можете да одобрявате собствен имот.'; end if;
 if l.status='removed' or p_status is null or p_status not in ('active','rejected','flagged','removed') then raise check_violation; end if;
 if p_status='active' then
  if l.status not in ('pending_review','flagged') then raise check_violation using message='Изпрати обявата за преглед преди одобрение.'; end if;
  if not exists(select 1 from public.listing_photos where listing_id=p_id) then raise check_violation using message='Добави поне една реална снимка преди одобрение.'; end if;
  if not exists(select 1 from public.profiles where id=l.owner_id and status='active') then raise check_violation using message='Акаунтът на обявителя трябва да е активен.'; end if;
 end if;
 if p_status='rejected' and l.status not in ('pending_review','flagged') then raise check_violation; end if;
 update public.listings set status=p_status,expires_at=case when p_status='active' then now()+interval '30 days' else expires_at end,
 rented_at=case when p_status='active' then null else rented_at end where id=p_id;
 insert into private.audit_events(actor_id,action,entity_id,reason,metadata) values(auth.uid(),'listing.moderation',p_id,trim(p_reason),
  jsonb_build_object('from',l.status,'to',p_status,'property_verification_required',false,'property_verification_valid',coalesce(l.verification_expires_at>now(),false)));
end; $$;

create or replace function private.owner_set_listing_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare l public.listings;
begin
 if not private.owns_listing(p_id) then raise insufficient_privilege; end if;
 select * into strict l from public.listings where id=p_id for update;
 if not ((l.status='active' and p_status in ('rented','deactivated')) or
 (l.status in ('draft','expired','deactivated','rejected','rented') and p_status='pending_review') or
 (l.status='pending_review' and p_status='deactivated')) then raise check_violation using message='Недопустима промяна на статуса.'; end if;
 update public.listings set status=p_status,rented_at=case when p_status='rented' then now() else null end where id=p_id;
 insert into private.audit_events(actor_id,action,entity_id,reason,metadata) values(auth.uid(),'listing.owner_status',p_id,'Промяна от собственик',jsonb_build_object('from',l.status,'to',p_status));
end; $$;

-- Private procedure owns the write; owners still have no direct UPDATE grant.
-- A receipt in the existing private audit log makes lost-response retries idempotent.
create function private.owner_edit_listing(p_id uuid,p_input jsonb,p_request_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare l public.listings; v public.listings; prior_hash text; input_hash text;
begin
 if not private.owns_listing(p_id) then raise insufficient_privilege using message='Можеш да редактираш само собствената си обява.'; end if;
 if p_request_id is null or p_input is null or jsonb_typeof(p_input)<>'object' or char_length(p_input::text)>12000 then raise invalid_parameter_value; end if;
 if exists(select 1 from jsonb_object_keys(p_input) k where k not in ('title','description','type','price_eur','area_m2','rooms','city_id','neighborhood_id','nearby_university_ids','available_from','deposit','floor','total_floors','furnished','pets_allowed','utilities_included')) then
  raise invalid_parameter_value using message='Непозволени полета за редакция.';
 end if;
 if not p_input ?& array['title','description','type','price_eur','area_m2','rooms','city_id','nearby_university_ids','available_from','furnished','pets_allowed','utilities_included'] then raise invalid_parameter_value; end if;
 select * into strict l from public.listings where id=p_id for update;
 input_hash:=md5(p_input::text);
 select metadata->>'input_hash' into prior_hash from private.audit_events where actor_id=auth.uid() and entity_id=p_id and action='listing.owner_edit' and metadata->>'request_id'=p_request_id::text limit 1;
 if prior_hash is not null then
  if prior_hash<>input_hash then raise invalid_parameter_value using message='Опитът за запис вече е използван с други данни.'; end if;
  return;
 end if;
 if l.status in ('removed','flagged') then raise check_violation using message='Тази обява е в модерация. Свържи се с екипа за промяна.'; end if;
 v:=jsonb_populate_record(null::public.listings,p_input);
 update public.listings set title=trim(v.title),description=trim(v.description),type=v.type,price_eur=v.price_eur,area_m2=v.area_m2,rooms=v.rooms,
  city_id=v.city_id,neighborhood_id=v.neighborhood_id,nearby_university_ids=v.nearby_university_ids,available_from=v.available_from,deposit=v.deposit,
  floor=v.floor,total_floors=v.total_floors,furnished=v.furnished,pets_allowed=v.pets_allowed,utilities_included=v.utilities_included,
  status='pending_review',expires_at=null,rented_at=null,ownership_verified_at=null,verification_expires_at=null,verification_method=null where id=p_id;
 insert into private.audit_events(actor_id,action,entity_id,reason,metadata) values(auth.uid(),'listing.owner_edit',p_id,'Редакция от обявителя; изпратена за преглед.',
  jsonb_build_object('from',l.status,'to','pending_review','request_id',p_request_id,'input_hash',input_hash));
end; $$;
revoke all on function private.owner_edit_listing(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function private.owner_edit_listing(uuid,jsonb,uuid) to authenticated;
create function public.owner_edit_listing(p_id uuid,p_input jsonb,p_request_id uuid) returns void language sql security invoker set search_path='' as $$ select private.owner_edit_listing(p_id,p_input,p_request_id); $$;
revoke all on function public.owner_edit_listing(uuid,jsonb,uuid) from public,anon;
grant execute on function public.owner_edit_listing(uuid,jsonb,uuid) to authenticated;
