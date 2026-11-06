-- ─── Supervisor tiers (درجات المشرفين) ─────────────────────────────────────
-- PREPARED 2026-11-06, NOT APPLIED. Backup first: /downloads/qaryati-backup-20261106
-- Adds staff tiers on top of profiles.role and makes the owner the only one
-- who can appoint or change supervisors. Alter/replace only; no data deleted.
--
-- Tiers: customer < orders_admin / content_admin < admin < owner
--   owner         المالك: everything, the only one who manages supervisors
--   admin         مشرف عام: every admin section except supervisors and money settings
--   content_admin مشرف المراجعة والبلاغات: review queues (jobs, market, rides)
--   orders_admin  مشرف الطلبات والمحلات: provider dashboard and orders follow-up

-- 1) Allow the new role values
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'orders_admin', 'content_admin', 'admin', 'owner'));

-- 2) The owner account (only this row changes)
update public.profiles set role = 'owner' where email = 'alhinaawi@gmail.com';

-- 3) is_admin() now means "any staff tier", so every existing policy and
--    function keeps working for all supervisors
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('orders_admin', 'content_admin', 'admin', 'owner') and not blocked
  );
$$;

-- 4) is_owner(): the app and the role function use it for owner-only actions
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner' and not blocked);
$$;
grant execute on function public.is_owner() to anon, authenticated;

-- 5) Tier-scoped guards used by the admin functions below
create or replace function public.can_review_content() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('content_admin', 'admin', 'owner') and not blocked
  );
$$;

create or replace function public.can_manage_orders() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('orders_admin', 'admin', 'owner') and not blocked
  );
$$;

-- 6) Only the owner appoints or changes supervisors, and the owner role
--    itself never changes from the app (database only, by hand)
create or replace function public.admin_set_role(target uuid, new_role text)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  result public.profiles;
begin
  if not public.is_owner() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'you can''t change your own role' using errcode = '42501';
  end if;
  if new_role not in ('customer', 'orders_admin', 'content_admin', 'admin') then
    raise exception 'bad role' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where id = target and role = 'owner') then
    raise exception 'the owner role changes from the database only' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target returning * into result;
  return result;
end $$;

-- 7) Blocking a user stays with the general supervisor and the owner
create or replace function public.admin_set_blocked(target uuid, new_blocked boolean)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  result public.profiles;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner') and not blocked
  ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'you can''t block yourself' using errcode = '42501';
  end if;
  update public.profiles set blocked = coalesce(new_blocked, false) where id = target returning * into result;
  return result;
end $$;

-- 8) Review queues answer to the content tier; orders and couriers to the
--    orders tier. Same function bodies as live, only the guard changed.
create or replace function public.admin_review_job(p_id uuid, p_approve boolean, p_reason text DEFAULT NULL::text)
 RETURNS jobs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare
  j public.jobs;
begin
  if not public.can_review_content() then
    raise exception 'jobs:not_admin' using errcode = 'P0001';
  end if;
  update public.jobs
     set status = case when p_approve then 'approved' else 'rejected' end,
         reject_reason = case when p_approve then null
                              else nullif(left(btrim(coalesce(p_reason, '')), 200), '') end
   where id = p_id
  returning * into j;
  if j.id is null then
    raise exception 'jobs:not_found' using errcode = 'P0001';
  end if;
  return j;
end $$;

create or replace function public.admin_list_orders(p_status text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_village text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 100)
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare
  v text := nullif(public.ar_normalize(coalesce(p_village, '')), '');
  q text := nullif(btrim(coalesce(p_search, '')), '');
begin
  if not public.can_manage_orders() then raise exception 'admins only' using errcode = '42501'; end if;
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

create or replace function public.admin_set_order_status(p_id uuid, p_status text, p_reason text DEFAULT NULL::text)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare o public.orders;
begin
  if not public.can_manage_orders() then raise exception 'admins only' using errcode = '42501'; end if;
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

create or replace function public.admin_add_courier(p_login text, p_phone text DEFAULT NULL::text, p_vehicle text DEFAULT NULL::text)
 RETURNS couriers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare p public.profiles; c public.couriers; login text := lower(btrim(coalesce(p_login, '')));
begin
  if not public.can_manage_orders() then raise exception 'tracking:not_admin' using errcode = '42501'; end if;
  select * into p from public.profiles
   where lower(username) = ltrim(login, '@') or lower(email) = login limit 1;
  if p.id is null then raise exception 'tracking:no_account' using errcode = 'P0002'; end if;
  insert into public.couriers (user_id, name, phone, vehicle)
  values (p.id, coalesce(nullif(btrim(p.name), ''), p.username, 'مندوب'),
          coalesce(nullif(btrim(p_phone), ''), p.phone),
          coalesce(nullif(btrim(p_vehicle), ''), 'موتوسيكل'))
  on conflict (user_id) do update
    set active = true,
        phone = coalesce(nullif(btrim(p_phone), ''), public.couriers.phone),
        vehicle = coalesce(nullif(btrim(p_vehicle), ''), public.couriers.vehicle)
  returning * into c;
  return c;
exception when not_null_violation or check_violation then
  raise exception 'tracking:bad_phone' using errcode = '22023';
end $$;

create or replace function public.admin_assign_courier(p_order uuid, p_courier uuid)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare o public.orders;
begin
  if not public.can_manage_orders() then raise exception 'tracking:not_admin' using errcode = '42501'; end if;
  if p_courier is not null and not exists (select 1 from public.couriers where user_id = p_courier and active) then
    raise exception 'tracking:no_courier' using errcode = 'P0002';
  end if;
  update public.orders set courier_id = p_courier
   where id = p_order and status not in ('done','cancelled')
  returning * into o;
  if o.id is null then raise exception 'tracking:closed' using errcode = 'P0002'; end if;
  if p_courier is null then delete from public.courier_locations where order_id = p_order; end if;
  return o;
end $$;

create or replace function public.admin_set_courier_active(p_user uuid, p_active boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
begin
  if not public.can_manage_orders() then raise exception 'tracking:not_admin' using errcode = '42501'; end if;
  update public.couriers set active = p_active where user_id = p_user;
end $$;
