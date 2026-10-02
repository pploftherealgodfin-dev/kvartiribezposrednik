-- Pilot search follows public listing RLS, review and expiry; document verification stays an independent badge.
-- All input validation, filter semantics, pagination and sorting remain unchanged.
CREATE OR REPLACE FUNCTION public.search_listing_ids(p_filters jsonb DEFAULT '{}'::jsonb, p_sort text DEFAULT 'newest'::text, p_page integer DEFAULT 1, p_size integer DEFAULT 18)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
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
 where l.status='active' and l.expires_at>now()
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
end; $function$
