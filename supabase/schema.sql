-- ─── Qaryati: Supabase schema
-- Run once in Supabase → SQL Editor. Matches the mappers in src/repositories.
--
-- Auth: the app signs in with phone + password by turning the phone into an
-- internal address (01012345678@phone.qaryati.app). In Authentication →
-- Providers → Email, turn OFF "Confirm email", or new accounts can't sign in.
-- First admin: after you register in the app, run
--   update public.profiles set role = 'admin' where phone = '01XXXXXXXXX';

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
  phone      text not null unique,
  village    text not null default '',
  address    text not null default '',
  role       text not null default 'customer' check (role in ('customer','admin')),
  blocked    boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, phone, village, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'village', ''),
    coalesce(new.raw_user_meta_data ->> 'address', '')
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

-- Customers can edit their name/village/address, never their own role or block
create or replace function public.protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if (new.role is distinct from old.role or new.blocked is distinct from old.blocked
      or new.phone is distinct from old.phone) and not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles for each row execute function public.protect_profile_columns();

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

-- ─── Row Level Security ──────────────────────────────────────────────────────────────
alter table public.services  enable row level security;
alter table public.shops     enable row level security;
alter table public.providers enable row level security;
alter table public.profiles  enable row level security;
alter table public.orders    enable row level security;

create policy "catalog: anyone reads services"  on public.services  for select using (not hidden or public.is_admin());
create policy "catalog: anyone reads shops"     on public.shops     for select using (true);
create policy "catalog: anyone reads providers" on public.providers for select using (active or public.is_admin());
create policy "catalog: admins edit services"   on public.services  for all using (public.is_admin()) with check (public.is_admin());
create policy "catalog: admins edit shops"      on public.shops     for all using (public.is_admin()) with check (public.is_admin());
create policy "catalog: admins edit providers"  on public.providers for all using (public.is_admin()) with check (public.is_admin());

create policy "profiles: read own or admin"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- Guests may order (user_id null); signed-in customers only as themselves
create policy "orders: anyone creates" on public.orders for insert
  with check (user_id is null or user_id = auth.uid());
create policy "orders: read own or admin" on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
create policy "orders: admins update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());
