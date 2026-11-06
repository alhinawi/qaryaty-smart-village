-- ─── Saved addresses on the map (like Talabat) + the order's location ───────────────
-- Run after supabase/schema.sql. Safe to run again.
--   • user_addresses: each customer sees and edits only their own addresses.
--     One address is the default. The first one is the default by itself;
--     deleting the default makes the newest one left the default.
--   • A new account can send its first address in the sign-up metadata
--     (address_lat, address_lng, ...): a trigger saves it here. A bad value never
--     blocks the sign-up, the address is just skipped.
--   • orders.lat / orders.lng: where to deliver, and orders.location_url opens it
--     on Google Maps for whoever handles the order.

create table if not exists public.user_addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null default 'البيت',
  lat         double precision not null,
  lng         double precision not null,
  street      text not null default '',
  building    text not null default '',
  floor       text not null default '',
  landmark    text not null default '',
  phone       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint user_addresses_sane check (
    lat between -90 and 90 and lng between -180 and 180
    and length(btrim(label)) between 1 and 40
    and length(street) <= 150 and length(building) <= 80
    and length(floor) <= 30 and length(landmark) <= 150
    and (phone is null or phone ~ '^01[0125][0-9]{8}$')
  )
);

create index if not exists user_addresses_user_idx on public.user_addresses (user_id, created_at desc);
-- At most one default per person
create unique index if not exists user_addresses_one_default
  on public.user_addresses (user_id) where is_default;

-- ─── Keep "one default" and the timestamps right
create or replace function public.user_addresses_before_write() returns trigger
language plpgsql set search_path = public as $$
declare
  existing int;
begin
  if tg_op = 'INSERT' then
    select count(*) into existing from public.user_addresses where user_id = new.user_id;
    if existing >= 20 then
      raise exception 'too many addresses' using errcode = '23514';
    end if;
    -- The first address is the default
    if existing = 0 then new.is_default := true; end if;
    new.created_at := now();
  else
    new.user_id := old.user_id;      -- an address never moves to another account
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  new.label := btrim(new.label);
  if new.is_default then
    update public.user_addresses set is_default = false
     where user_id = new.user_id and is_default and id <> new.id;
  end if;
  return new;
end $$;

drop trigger if exists user_addresses_before_write on public.user_addresses;
create trigger user_addresses_before_write
  before insert or update on public.user_addresses
  for each row execute function public.user_addresses_before_write();

create or replace function public.user_addresses_after_delete() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.is_default then
    update public.user_addresses set is_default = true
     where id = (select id from public.user_addresses
                  where user_id = old.user_id order by created_at desc limit 1);
  end if;
  return null;
end $$;

drop trigger if exists user_addresses_after_delete on public.user_addresses;
create trigger user_addresses_after_delete
  after delete on public.user_addresses
  for each row execute function public.user_addresses_after_delete();

-- ─── The first address from the sign-up form
create or replace function public.handle_new_user_address() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if m ? 'address_lat' and m ? 'address_lng' then
    begin
      insert into public.user_addresses
        (user_id, label, lat, lng, street, building, floor, landmark, phone, is_default)
      values (
        new.id,
        coalesce(nullif(left(btrim(m ->> 'address_label'), 40), ''), 'البيت'),
        (m ->> 'address_lat')::double precision,
        (m ->> 'address_lng')::double precision,
        left(btrim(coalesce(m ->> 'address_street', '')), 150),
        left(btrim(coalesce(m ->> 'address_building', '')), 80),
        left(btrim(coalesce(m ->> 'address_floor', '')), 30),
        left(btrim(coalesce(m ->> 'address_landmark', '')), 150),
        nullif(btrim(coalesce(m ->> 'address_phone', m ->> 'phone', '')), ''),
        true
      );
    exception when others then
      -- Never block the sign-up for the address
      raise warning 'handle_new_user_address skipped: %', sqlerrm;
    end;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created_address on auth.users;
create trigger on_auth_user_created_address
  after insert on auth.users
  for each row execute function public.handle_new_user_address();

-- ─── Privileges and RLS
revoke all on public.user_addresses from anon, authenticated;
grant select, insert, update, delete on public.user_addresses to authenticated;
revoke all on function public.user_addresses_before_write() from public, anon, authenticated;
revoke all on function public.user_addresses_after_delete() from public, anon, authenticated;
revoke all on function public.handle_new_user_address() from public, anon, authenticated;

alter table public.user_addresses enable row level security;

drop policy if exists "addresses: read own"   on public.user_addresses;
drop policy if exists "addresses: add own"    on public.user_addresses;
drop policy if exists "addresses: edit own"   on public.user_addresses;
drop policy if exists "addresses: delete own" on public.user_addresses;
create policy "addresses: read own" on public.user_addresses for select to authenticated
  using (user_id = (select auth.uid()));
create policy "addresses: add own" on public.user_addresses for insert to authenticated
  with check (user_id = (select auth.uid()) and not public.is_blocked());
create policy "addresses: edit own" on public.user_addresses for update to authenticated
  using (user_id = (select auth.uid()) and not public.is_blocked())
  with check (user_id = (select auth.uid()) and not public.is_blocked());
create policy "addresses: delete own" on public.user_addresses for delete to authenticated
  using (user_id = (select auth.uid()));

-- ─── Where to deliver an order
alter table public.orders add column if not exists lat double precision;
alter table public.orders add column if not exists lng double precision;
alter table public.orders drop constraint if exists orders_location_sane;
alter table public.orders add constraint orders_location_sane check (
  (lat is null and lng is null)
  or (lat between -90 and 90 and lng between -180 and 180)
);
alter table public.orders add column if not exists location_url text
  generated always as (
    case when lat is not null and lng is not null
      then 'https://www.google.com/maps/search/?api=1&query=' || lat::text || ',' || lng::text
    end
  ) stored;
