-- ─── Admin dashboard (لوحة التحكم) ─────────────────────────────────────────
-- Everything here is checked on the server with public.is_admin(); the app's
-- own "is this an admin?" check only decides what to show.
--
-- 1. Orders can be cancelled (new status 'cancelled' + a reason), and admins
--    change status through admin_set_order_status().
-- 2. admin_list_orders(): orders with the customer's name and village, filtered
--    on the server (status, dates, village, search).
-- 3. admin_overview(): the numbers on the dashboard's first screen.
-- 4. Shops and catalog products can be hidden (like services.hidden and
--    providers.active). Hidden rows are visible to admins only, so a hidden
--    product or shop can't be ordered (the order trigger reads as the caller).
-- 5. New shops / services / providers get their id from a sequence.
-- 6. A public 'catalog-photos' bucket that only admins can write to.
-- Safe to run again.

-- 1. Cancelled orders ---------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%onway%'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'onway', 'done', 'cancelled'));

alter table public.orders add column if not exists cancel_reason text;
alter table public.orders add column if not exists status_changed_at timestamptz;
alter table public.orders drop constraint if exists orders_cancel_reason_len;
alter table public.orders add constraint orders_cancel_reason_len
  check (length(coalesce(cancel_reason, '')) <= 300);

create or replace function public.admin_set_order_status(p_id uuid, p_status text, p_reason text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'admins only' using errcode = '42501'; end if;
  if p_status not in ('pending', 'confirmed', 'onway', 'done', 'cancelled') then
    raise exception 'bad status' using errcode = '22023';
  end if;
  update public.orders
     set status = p_status,
         status_changed_at = now(),
         cancel_reason = case when p_status = 'cancelled'
                              then nullif(left(btrim(coalesce(p_reason, '')), 300), '')
                              else null end
   where id = p_id
  returning * into o;
  if o.id is null then raise exception 'order not found' using errcode = 'P0002'; end if;
  return o;
end $$;
revoke all on function public.admin_set_order_status(uuid, text, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text, text) to authenticated;

-- 2. Orders list for admins -----------------------------------------------------
create or replace function public.admin_list_orders(
  p_status  text default null,
  p_from    timestamptz default null,
  p_to      timestamptz default null,
  p_village text default null,
  p_search  text default null,
  p_limit   int default 100
) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v text := nullif(public.ar_normalize(coalesce(p_village, '')), '');
  q text := nullif(btrim(coalesce(p_search, '')), '');
begin
  if not public.is_admin() then raise exception 'admins only' using errcode = '42501'; end if;
  return query
    select to_jsonb(o) || jsonb_build_object(
             'customer_name', p.name,
             'customer_username', p.username,
             'customer_village', p.village)
      from public.orders o
      left join public.profiles p on p.id = o.user_id
     where (p_status is null or o.status = p_status)
       and (p_from is null or o.created_at >= p_from)
       and (p_to is null or o.created_at < p_to)
       and (v is null
            or public.ar_normalize(coalesce(p.village, '')) like '%' || v || '%'
            or public.ar_normalize(o.address) like '%' || v || '%')
       and (q is null
            or o.order_number ilike '%' || q || '%'
            or o.phone like '%' || q || '%'
            or o.service_name ilike '%' || q || '%'
            or coalesce(p.name, '') ilike '%' || q || '%')
     order by o.created_at desc
     limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;
revoke all on function public.admin_list_orders(text, timestamptz, timestamptz, text, text, int) from public, anon;
grant execute on function public.admin_list_orders(text, timestamptz, timestamptz, text, text, int) to authenticated;

-- 3. Dashboard numbers -------------------------------------------------------------
-- "Today" and "last 7 days" use Cairo days. Cancelled orders count nowhere
-- except their own status count.
create or replace function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  today_start timestamptz := date_trunc('day', now() at time zone 'Africa/Cairo') at time zone 'Africa/Cairo';
  week_start  timestamptz := (date_trunc('day', now() at time zone 'Africa/Cairo') - interval '6 days') at time zone 'Africa/Cairo';
  result jsonb;
begin
  if not public.is_admin() then raise exception 'admins only' using errcode = '42501'; end if;

  select jsonb_build_object(
    'today', (select jsonb_build_object(
                'orders', count(*),
                'revenue', coalesce(sum(total_amount), 0),
                'commission', coalesce(sum(commission_amount), 0))
              from public.orders where status <> 'cancelled' and created_at >= today_start),
    'week', (select jsonb_build_object(
                'orders', count(*),
                'revenue', coalesce(sum(total_amount), 0),
                'commission', coalesce(sum(commission_amount), 0))
              from public.orders where status <> 'cancelled' and created_at >= week_start),
    'all_time', (select jsonb_build_object(
                'orders', count(*),
                'revenue', coalesce(sum(total_amount), 0),
                'commission', coalesce(sum(commission_amount), 0))
              from public.orders where status <> 'cancelled'),
    'commission_done', (select coalesce(sum(commission_amount), 0) from public.orders where status = 'done'),
    'status_counts', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                        from (select status, count(*) n from public.orders group by status) s),
    'users', (select jsonb_build_object(
                'total', count(*),
                'today', count(*) filter (where created_at >= today_start),
                'week', count(*) filter (where created_at >= week_start),
                'admins', count(*) filter (where role = 'admin'),
                'blocked', count(*) filter (where blocked))
              from public.profiles),
    'pending', jsonb_build_object(
      'orders', (select count(*) from public.orders where status = 'pending'),
      'jobs', (select count(*) from public.jobs where status = 'pending'),
      'donations', (select count(*) from public.donation_requests where status = 'new'),
      'market_hidden', (select count(*) from public.market_listings where status = 'hidden'),
      'rides_hidden', (select count(*) from public.rides where status = 'hidden')),
    'promo', (select jsonb_build_object(
                'orders', count(*),
                'fees_waived', coalesce(sum(discount_amount), 0))
              from public.orders where discount_code = 'QARYA1' and status <> 'cancelled'),
    'villages_served', (select count(*) from public.villages where served)
  ) into result;
  return result;
end $$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- 4. Hide shops and catalog products -------------------------------------------------
alter table public.shops add column if not exists hidden boolean not null default false;
alter table public.catalog_products add column if not exists hidden boolean not null default false;

drop policy if exists "catalog: anyone reads shops" on public.shops;
create policy "catalog: anyone reads shops" on public.shops
  for select using (not hidden or public.is_admin());
drop policy if exists "catalog: anyone reads products" on public.catalog_products;
create policy "catalog: anyone reads products" on public.catalog_products
  for select using (not hidden or public.is_admin());

-- 5. Ids for new catalog rows -------------------------------------------------------------
create sequence if not exists public.shops_id_seq;
create sequence if not exists public.services_id_seq;
create sequence if not exists public.providers_id_seq;
select setval('public.shops_id_seq',     greatest((select coalesce(max(id), 0) from public.shops), 1000));
select setval('public.services_id_seq',   greatest((select coalesce(max(id), 0) from public.services), 1000));
select setval('public.providers_id_seq',  greatest((select coalesce(max(id), 0) from public.providers), 1000));
alter table public.shops     alter column id set default nextval('public.shops_id_seq');
alter table public.services  alter column id set default nextval('public.services_id_seq');
alter table public.providers alter column id set default nextval('public.providers_id_seq');
alter sequence public.shops_id_seq     owned by public.shops.id;
alter sequence public.services_id_seq  owned by public.services.id;
alter sequence public.providers_id_seq owned by public.providers.id;
grant usage on sequence public.shops_id_seq, public.services_id_seq, public.providers_id_seq to authenticated;

-- 6. Catalog photos bucket (public read, admins write) ------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-photos', 'catalog-photos', true, 3145728,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "catalog photos: admins add" on storage.objects;
create policy "catalog photos: admins add" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-photos' and public.is_admin());
drop policy if exists "catalog photos: admins change" on storage.objects;
create policy "catalog photos: admins change" on storage.objects for update to authenticated
  using (bucket_id = 'catalog-photos' and public.is_admin())
  with check (bucket_id = 'catalog-photos' and public.is_admin());
drop policy if exists "catalog photos: admins delete" on storage.objects;
create policy "catalog photos: admins delete" on storage.objects for delete to authenticated
  using (bucket_id = 'catalog-photos' and public.is_admin());

notify pgrst, 'reload schema';
