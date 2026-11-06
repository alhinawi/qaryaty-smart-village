-- ─── Google sign-in like Talabat: in right away, delivery details at the first order ───
-- Run after supabase/schema.sql. Safe to run again.
--   • A Google account gets a username made from its email (ahmed.ali@gmail.com →
--     ahmed_ali, or ahmed_ali_4821 when that one is taken). Nobody is asked to pick one.
--   • complete_profile() (called before the first order) needs the phone, the village
--     and the address; a username that is missing is made the same way.
--   • Google accounts made before this get their username now.

-- A free username from any text (usually the part of the email before @)
create or replace function public.make_username(seed text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  base      text := lower(coalesce(seed, ''));
  candidate text;
  tries     int := 0;
begin
  base := regexp_replace(base, '[^a-z0-9_]+', '_', 'g');
  base := btrim(regexp_replace(base, '_{2,}', '_', 'g'), '_');
  if base !~ '[a-z]' or length(base) < 3 then
    base := 'user' || base;
  end if;
  base := rtrim(left(base, 14), '_');
  candidate := base;
  loop
    if candidate ~ '^[a-z0-9_]{3,20}$' and candidate ~ '[a-z]'
       and not (candidate = any (public.reserved_usernames()))
       and not exists (select 1 from public.profiles where username = candidate) then
      return candidate;
    end if;
    tries := tries + 1;
    if tries > 50 then
      raise exception 'could not make a username' using errcode = '23505';
    elsif tries > 20 then
      candidate := 'user_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
    else
      candidate := base || '_' || (floor(random() * 9000) + 1000)::int;
    end if;
  end loop;
end $$;

revoke all on function public.make_username(text) from public, anon, authenticated;

-- New account → profile. Email sign-ups as before; Google gets a username at once
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone    text := btrim(coalesce(new.raw_user_meta_data ->> 'phone', ''));
  v_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  v_provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  if v_provider not in ('email', 'phone') then
    insert into public.profiles (id, name, username, email, phone, village, address)
    values (
      new.id,
      left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), 80),
      public.make_username(split_part(coalesce(new.email, ''), '@', 1)),
      lower(new.email),
      '',
      '',
      ''
    );
    return new;
  end if;
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

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Before the first order: phone (once), village and address. A missing username is made.
create or replace function public.complete_profile(
  p_name text, p_username text, p_phone text, p_village text, p_address text default ''
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_phone    text := btrim(coalesce(p_phone, ''));
  v_name     text := btrim(coalesce(p_name, ''));
  v_village  text := btrim(coalesce(p_village, ''));
  v_address  text := btrim(coalesce(p_address, ''));
  current_row public.profiles;
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select * into current_row from public.profiles where id = auth.uid();
  if not found then
    raise exception 'no profile' using errcode = '42501';
  end if;
  if current_row.blocked then
    raise exception 'blocked' using errcode = '42501';
  end if;
  if current_row.username is null and (
       v_username !~ '^[a-z0-9_]{3,20}$' or v_username !~ '[a-z]'
       or v_username = any (public.reserved_usernames())
       or exists (select 1 from public.profiles where username = v_username)) then
    v_username := public.make_username(split_part(coalesce(current_row.email, ''), '@', 1));
  end if;
  if current_row.phone = '' and v_phone !~ '^01[0125][0-9]{8}$' then
    raise exception 'a valid phone number is required' using errcode = '22023';
  end if;
  if length(v_name) < 2 or length(v_village) < 2 then
    raise exception 'name and village are required' using errcode = '22023';
  end if;
  if v_address = '' and btrim(current_row.address) = '' then
    raise exception 'an address is required' using errcode = '22023';
  end if;
  update public.profiles set
    username = coalesce(username, v_username),
    phone    = case when phone = '' then v_phone else phone end,
    name     = left(v_name, 80),
    village  = left(v_village, 120),
    address  = left(coalesce(nullif(v_address, ''), address), 300)
  where id = auth.uid()
  returning * into result;
  return result;
end $$;

revoke all on function public.complete_profile(text, text, text, text, text) from public, anon;
grant execute on function public.complete_profile(text, text, text, text, text) to authenticated;

-- Google accounts made before this: give them a username now (one at a time, so each sees the last)
do $$
declare
  r record;
begin
  for r in
    select p.id, p.email from public.profiles p
      join auth.users u on u.id = p.id
     where p.username is null
       and coalesce(u.raw_app_meta_data ->> 'provider', 'email') not in ('email', 'phone')
  loop
    update public.profiles
       set username = public.make_username(split_part(coalesce(r.email, ''), '@', 1))
     where id = r.id;
  end loop;
end $$;
