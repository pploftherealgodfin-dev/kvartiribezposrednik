-- Keep FK maintenance indexed and evaluate caller identity once per messages query.
create index listings_neighborhood_city_fk_idx on public.listings(neighborhood_id,city_id);
drop policy messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using(
 (select private.is_active_user()) and exists(
  select 1 from public.conversations c where c.id=conversation_id and (select auth.uid()) in (c.owner_id,c.tenant_id)
 )
);
-- Intentionally no direct client access to the contact-access audit table.
create policy contact_access_no_client_access on private.contact_access for all to anon,authenticated using(false) with check(false);
