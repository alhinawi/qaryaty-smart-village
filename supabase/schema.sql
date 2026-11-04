-- ─── Qaryati: Supabase schema
-- Run in Supabase → SQL Editor, then run seed.sql. Safe to run again.
-- Matches the mappers in src/repositories.
--
-- Security model (the publishable key is public, it ships in the app):
--   • Every table has Row Level Security on.
--   • Catalog (services, shops, providers): anyone reads; only admins write.
--   • profiles: you read your own row and may change only name, village and
--     address. role, blocked, phone, email, username and anything added later (a balance, points)
--     can't be changed from the app: column privileges are a whitelist.
--     Admins change role/blocked only through admin_set_role / admin_set_blocked.
--   • orders: anyone may place one (guests too), only as themselves; the status
--     always starts as 'pending'; a customer reads only their own orders;
--     only admins change the status, and nothing else.
--   • There is no balance/wallet in the database. If one is added later, keep it
--     out of every grant below and change it only in a SECURITY DEFINER function
--     or an Edge Function with the secret key.
--
-- Auth: customers sign up with their real email + password; the phone is a
-- contact field. Every new account also picks a unique username (a-z 0-9 _,
-- 3–20, stored lowercase); it is fixed after sign-up. Anyone may ask
-- username_available() before signing up; it answers yes/no and nothing else. Keep "Confirm email" ON (Authentication → Sign In / Providers)
-- with custom SMTP so the activation email comes from the site's own address.
-- First admin: after you register and activate in the app, run in the SQL Editor
--   update public.profiles set role = 'admin' where email = 'you@example.com';

-- ─── Catalog (anyone can read) ─────────────────────────────────────────────────
create table if not exists public.services (
  id            bigint primary key,
  cat           text not null check (cat in ('food','delivery','craft','edu','health','care','home')),
  emoji         text not null,
  name          text not null,
  description   text not null default '',
  time          text not null default '',
  price         text not null,
  numeric_price numeric,
  price_type    text not null check (price_type in ('fixed','from','quote')),
  rating        text not null default '5.0',
  badge         text check (badge in ('popular','new','')),
  featured      boolean not null default false,
  subject       text,
  options       jsonb,
  hidden        boolean not null default false
);

create table if not exists public.shops (
  id          bigint primary key,
  emoji       text not null,
  name        text not null,
  description text not null default '',
  open        boolean not null default true,
  time        text not null default '',
  bg_color    text not null default '#ffffff'
);

create table if not exists public.providers (
  id               bigint primary key,
  kind             text not null check (kind in ('teacher','nurse','doctor','babysitter','cleaner','worker')),
  service_id       bigint not null references public.services (id),
  name             text not null,
  gender           text not null check (gender in ('male','female')),
  photo            text,
  subject          text,
  stages           text[],
  specialty        text,
  role             text,
  experience_years int not null default 0,
  rating           numeric(2,1) not null default 5.0,
  reviews          int not null default 0,
  price            text not null,
  numeric_price    numeric,
  price_type       text not null check (price_type in ('fixed','from','quote')),
  area             text not null default '',
  village          text not null default '',
  bio              text not null default '',
  modes            text[] not null default '{}',
  active           boolean not null default true
);

-- Projects created before workers were added: add the column and allow the new kind
alter table public.providers add column if not exists role text;
alter table public.providers drop constraint if exists providers_kind_check;
alter table public.providers add constraint providers_kind_check
  check (kind in ('teacher','nurse','doctor','babysitter','cleaner','worker'));
-- Projects created before villages were added
alter table public.providers add column if not exists village text not null default '';

-- ─── Profiles (one per auth user, filled by a trigger) ───────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  username   text,
  email      text,
  phone      text not null,
  village    text not null default '',
  address    text not null default '',
  role       text not null default 'customer' check (role in ('customer','admin')),
  blocked    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Projects created with phone sign-in: add the email, the phone is no longer the login
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists profiles_phone_key;
create index if not exists profiles_phone_idx on public.profiles (phone);

-- Usernames: projects created before them get the column; old rows stay null
alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or (username ~ '^[a-z0-9_]{3,20}$' and username ~ '[a-z]'));
create unique index if not exists profiles_username_key on public.profiles (username);

alter table public.profiles drop constraint if exists profiles_text_lengths;
alter table public.profiles add constraint profiles_text_lengths
  check (length(name) <= 80 and length(village) <= 120 and length(address) <= 300);

-- Names nobody may take (mirrors RESERVED_USERNAMES in src/utils/validators.ts)
create or replace function public.reserved_usernames() returns text[]
language sql immutable set search_path = public as $$
  select array['admin','administrator','root','system','support','help','qaryati','qaryaty']
$$;

-- Is this username free? Callable before signing in; reveals only yes/no.
create or replace function public.username_available(wanted text) returns boolean
language sql stable security definer set search_path = public as $$
  select lower(btrim(coalesce(wanted, ''))) ~ '^[a-z0-9_]{3,20}$'
     and lower(btrim(coalesce(wanted, ''))) ~ '[a-z]'
     and not (lower(btrim(coalesce(wanted, ''))) = any (public.reserved_usernames()))
     and not exists (select 1 from public.profiles where username = lower(btrim(coalesce(wanted, ''))))
$$;

-- New account → profile. The email is the one Supabase verified, the phone must
-- be an Egyptian mobile number, and the role is always 'customer'.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone    text := btrim(coalesce(new.raw_user_meta_data ->> 'phone', ''));
  v_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if v_phone !~ '^01[0125][0-9]{8}$' then
    raise exception 'a valid phone number is required' using errcode = '22023';
  end if;
  if v_username !~ '^[a-z0-9_]{3,20}$' or v_username !~ '[a-z]'
     or v_username = any (public.reserved_usernames()) then
    raise exception 'a valid username is required' using errcode = '22023';
  end if;
  -- A taken username fails on profiles_username_key (unique_violation) and the sign-up is refused
  insert into public.profiles (id, name, username, email, phone, village, address)
  values (
    new.id,
    left(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), 80),
    v_username,
    lower(new.email),
    v_phone,
    left(btrim(coalesce(new.raw_user_meta_data ->> 'village', '')), 120),
    left(btrim(coalesce(new.raw_user_meta_data ->> 'address', '')), 300)
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not blocked);
$$;

create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and blocked);
$$;

-- Replaced by column privileges (below): role/blocked/phone are not updatable
-- from the app at all, and the old trigger also stopped the SQL Editor.
drop trigger if exists protect_profile_columns on public.profiles;
drop function if exists public.protect_profile_columns();

-- Admin actions: the only way to change role or blocked from the app
create or replace function public.admin_set_role(target uuid, new_role text)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  result public.profiles;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'you can''t change your own role' using errcode = '42501';
  end if;
  if new_role not in ('customer','admin') then
    raise exception 'bad role' using errcode = '22023';
  end if;
  update public.profiles set role = new_role where id = target returning * into result;
  return result;
end $$;

create or replace function public.admin_set_blocked(target uuid, new_blocked boolean)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  result public.profiles;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'you can''t block yourself' using errcode = '42501';
  end if;
  update public.profiles set blocked = coalesce(new_blocked, false) where id = target returning * into result;
  return result;
end $$;

-- ─── Orders ─────────────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key,
  user_id         uuid references auth.users (id) on delete set null,
  order_number    text not null,
  service_name    text not null,
  service_emoji   text not null default '',
  address         text not null check (length(address) >= 5),
  phone           text not null check (phone ~ '^01[0125][0-9]{8}$'),
  notes           text,
  payment_method  text not null check (payment_method in ('cash','vodafone','instapay')),
  discount_code   text,
  discount_amount numeric not null default 0,
  total_amount    numeric not null default 0,
  is_estimate     boolean not null default false,
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','onway','done')),
  options         jsonb,
  service_id      bigint references public.services (id),
  provider_id     bigint references public.providers (id),
  created_at      timestamptz not null default now()
);

alter table public.orders drop constraint if exists orders_sane_values;
alter table public.orders add constraint orders_sane_values check (
  discount_amount >= 0 and total_amount >= 0
  and (discount_code is null or discount_code = 'QARYA1')
  and length(order_number) <= 40 and length(service_name) <= 300
  and length(service_emoji) <= 40 and length(address) <= 300
  and length(coalesce(notes, '')) <= 1000
  and pg_column_size(options) <= 8000
);

-- The first-order code once per account (guests are checked on the device only)
create unique index if not exists orders_one_promo_per_user
  on public.orders (user_id, discount_code)
  where user_id is not null and discount_code is not null;

-- Orders from the app always start as 'pending' with the server's clock
create or replace function public.orders_before_insert() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.status := 'pending';
    new.created_at := now();
  end if;
  return new;
end $$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert
  before insert on public.orders for each row execute function public.orders_before_insert();

-- ─── Privileges (what the app's key may touch at all) ────────────────────────────────
-- Supabase grants everything on new tables to anon/authenticated; start from
-- nothing and give back only what the app uses. RLS below narrows it to rows.
revoke all on public.services, public.shops, public.providers, public.profiles, public.orders
  from anon, authenticated;

grant select on public.services, public.shops, public.providers to anon, authenticated;
grant insert, update, delete on public.services, public.shops, public.providers to authenticated; -- admins only (RLS)

grant select on public.profiles to authenticated;
grant update (name, village, address) on public.profiles to authenticated;

grant insert on public.orders to anon, authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated; -- admins only (RLS)

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.orders_before_insert() from public, anon, authenticated;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
revoke all on function public.admin_set_blocked(uuid, boolean) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_set_blocked(uuid, boolean) to authenticated;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
revoke all on function public.reserved_usernames() from public, anon, authenticated;

-- Used inside the policies, so every role needs them; they only answer about the caller
grant execute on function public.is_admin(), public.is_blocked() to anon, authenticated;

-- ─── Row Level Security ──────────────────────────────────────────────────────────────
alter table public.services  enable row level security;
alter table public.shops     enable row level security;
alter table public.providers enable row level security;
alter table public.profiles  enable row level security;
alter table public.orders    enable row level security;

drop policy if exists "catalog: anyone reads services"  on public.services;
drop policy if exists "catalog: anyone reads shops"     on public.shops;
drop policy if exists "catalog: anyone reads providers" on public.providers;
drop policy if exists "catalog: admins edit services"   on public.services;
drop policy if exists "catalog: admins edit shops"      on public.shops;
drop policy if exists "catalog: admins edit providers"  on public.providers;
create policy "catalog: anyone reads services"  on public.services  for select using (not hidden or public.is_admin());
create policy "catalog: anyone reads shops"     on public.shops     for select using (true);
create policy "catalog: anyone reads providers" on public.providers for select using (active or public.is_admin());
create policy "catalog: admins edit services"   on public.services  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalog: admins edit shops"      on public.shops     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalog: admins edit providers"  on public.providers for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles: read own or admin"   on public.profiles;
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update to authenticated
  using ((id = (select auth.uid()) and not public.is_blocked()) or public.is_admin())
  with check ((id = (select auth.uid()) and not public.is_blocked()) or public.is_admin());

-- Guests may order (user_id null); signed-in customers only as themselves; blocked accounts can't
drop policy if exists "orders: anyone creates"    on public.orders;
drop policy if exists "orders: read own or admin" on public.orders;
drop policy if exists "orders: admins update"     on public.orders;
create policy "orders: anyone creates" on public.orders for insert to anon, authenticated
  with check ((user_id is null or user_id = (select auth.uid())) and not public.is_blocked());
create policy "orders: read own or admin" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "orders: admins update" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
