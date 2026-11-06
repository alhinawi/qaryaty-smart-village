-- ─── شير مواصلة: people who leave at the same time share the trip
-- Two kinds of posts:
--   taxi: "نتشارك تاكسي", someone looking for 1–3 people to split a taxi/microbus
--   car:  "عندي عربية", someone driving his own car who offers seats for a token price
-- Posts go live at once (rides are daily and time-bound, waiting for review would
-- make them useless); 3 reports hide a post until an admin looks at it.
-- Joining goes through request_ride / respond_ride_request / cancel_ride_request,
-- so seats_taken always equals the accepted seats.

create table if not exists public.rides (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  owner_name    text not null default '',
  kind          text not null check (kind in ('taxi', 'car')),
  from_village  text not null check (char_length(btrim(from_village)) between 2 and 120),
  to_place      text not null check (char_length(btrim(to_place)) between 2 and 80),
  depart_time   time not null,
  return_time   time,
  schedule      text not null check (schedule in ('daily', 'weekdays', 'days', 'once')),
  -- 0 = Sunday … 6 = Saturday, only for schedule 'days'
  days          smallint[] not null default '{}' check (days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  ride_date     date,
  seats         smallint not null check (seats between 1 and 7),
  seats_taken   smallint not null default 0 check (seats_taken >= 0),
  -- per seat: a token price for a car (0 = free), the expected share for a taxi (null = split equally)
  price         integer check (price between 0 and 300),
  car_type      text not null default '' check (char_length(car_type) <= 40),
  notes         text not null default '' check (char_length(notes) <= 500),
  riders        text not null default 'any' check (riders in ('any', 'women', 'men')),
  contact_phone text not null check (contact_phone ~ '^01[0125][0-9]{8}$'),
  whatsapp      boolean not null default true,
  status        text not null default 'active' check (status in ('active', 'paused', 'hidden')),
  reports_count integer not null default 0,
  expires_at    timestamptz not null default now() + interval '30 days',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint rides_schedule_fields check (
    (schedule = 'once' and ride_date is not null and cardinality(days) = 0)
    or (schedule = 'days' and ride_date is null and cardinality(days) between 1 and 6)
    or (schedule in ('daily', 'weekdays') and ride_date is null and cardinality(days) = 0)
  ),
  constraint rides_kind_fields check (
    (kind = 'car' and price is not null and price <= 100 and seats <= 6)
    or (kind = 'taxi' and seats <= 3)
  )
);

create index if not exists rides_public_idx on public.rides (status, expires_at, depart_time);
create index if not exists rides_owner_idx on public.rides (owner_id, created_at desc);

create table if not exists public.ride_requests (
  id             uuid primary key default gen_random_uuid(),
  ride_id        uuid not null references public.rides(id) on delete cascade,
  requester_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  requester_name text not null default '',
  phone          text not null check (phone ~ '^01[0125][0-9]{8}$'),
  seats          smallint not null default 1 check (seats between 1 and 3),
  note           text not null default '' check (char_length(note) <= 200),
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (ride_id, requester_id)
);

create index if not exists ride_requests_requester_idx on public.ride_requests (requester_id, created_at desc);

create table if not exists public.ride_reports (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references public.rides(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason      text not null check (reason in ('commercial', 'asks_money', 'unsafe', 'fake', 'other')),
  note        text not null default '' check (char_length(note) <= 300),
  created_at  timestamptz not null default now(),
  unique (ride_id, reporter_id)
);

-- Helpers that read past RLS (no recursion between the policies of the two tables)
create or replace function public.ride_owner(p_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select owner_id from public.rides where id = p_id;
$$;

create or replace function public.ride_has_my_request(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ride_requests
                  where ride_id = p_id and requester_id = auth.uid()
                    and status in ('pending', 'accepted'));
$$;

-- First name and the next one, as on the other services
create or replace function public.ride_short_name(p_user uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select split_part(btrim(name), ' ', 1) || coalesce(' ' || nullif(split_part(btrim(name), ' ', 2), ''), '')
                     from public.profiles where id = p_user), '');
$$;

-- A one-off trip: from today (Cairo) up to 30 days ahead; it ends the day after
create or replace function public.ride_check_date(p_date date) returns timestamptz
language plpgsql stable set search_path = public as $$
declare
  today date := (now() at time zone 'Africa/Cairo')::date;
begin
  if p_date < today or p_date > today + 30 then
    raise exception 'rides:bad_date' using errcode = 'P0001';
  end if;
  return (p_date + 1)::timestamp at time zone 'Africa/Cairo';
end $$;

create or replace function public.rides_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  trusted boolean := coalesce(current_setting('qaryaty.rides_system', true), '') = 'on';
  admin boolean := public.is_admin();
begin
  new.from_village := btrim(new.from_village);
  new.to_place := btrim(new.to_place);
  new.car_type := btrim(coalesce(new.car_type, ''));
  new.notes := btrim(coalesce(new.notes, ''));
  new.updated_at := now();
  if new.schedule <> 'days' then
    new.days := '{}';
  else
    new.days := (select coalesce(array_agg(distinct d order by d), '{}') from unnest(new.days) d);
  end if;
  if new.schedule <> 'once' then
    new.ride_date := null;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.owner_id := auth.uid();
    end if;
    if public.is_blocked() then
      raise exception 'rides:blocked' using errcode = 'P0001';
    end if;
    if not admin and (select count(*) from public.rides
                       where owner_id = new.owner_id and created_at > now() - interval '1 day') >= 5 then
      raise exception 'rides:too_many' using errcode = 'P0001';
    end if;
    new.owner_name := public.ride_short_name(new.owner_id);
    new.status := 'active';
    new.seats_taken := 0;
    new.reports_count := 0;
    new.created_at := now();
    new.expires_at := case when new.schedule = 'once' then public.ride_check_date(new.ride_date)
                           else now() + interval '30 days' end;
    return new;
  end if;

  new.id := old.id;
  new.owner_id := old.owner_id;
  new.owner_name := old.owner_name;
  new.kind := old.kind;
  new.created_at := old.created_at;
  if trusted then
    return new;
  end if;
  new.seats_taken := old.seats_taken;
  if new.seats < old.seats_taken then
    raise exception 'rides:seats_taken' using errcode = 'P0001';
  end if;
  if admin then
    if new.status = 'active' and old.status = 'hidden' then
      new.reports_count := 0;
      delete from public.ride_reports where ride_id = old.id;
    else
      new.reports_count := old.reports_count;
    end if;
  else
    new.reports_count := old.reports_count;
    if old.status = 'hidden' then
      new.status := 'hidden';
    elsif new.status = 'hidden' then
      new.status := old.status;
    end if;
  end if;
  if new.schedule = 'once' then
    if new.ride_date is distinct from old.ride_date or old.schedule <> 'once' then
      new.expires_at := public.ride_check_date(new.ride_date);
    elsif not admin then
      new.expires_at := old.expires_at;
    end if;
  elsif old.schedule = 'once' then
    new.expires_at := now() + interval '30 days';
  elsif not admin then
    new.expires_at := old.expires_at;
  end if;
  return new;
end $$;

drop trigger if exists rides_before_write on public.rides;
create trigger rides_before_write
  before insert or update on public.rides
  for each row execute function public.rides_before_write();

create or replace function public.ride_reports_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('qaryaty.rides_system', 'on', true);
  update public.rides
     set reports_count = reports_count + 1,
         status = case when reports_count + 1 >= 3 and status <> 'hidden' then 'hidden' else status end
   where id = new.ride_id;
  perform set_config('qaryaty.rides_system', 'off', true);
  return null;
end $$;

drop trigger if exists ride_reports_after_insert on public.ride_reports;
create trigger ride_reports_after_insert
  after insert on public.ride_reports
  for each row execute function public.ride_reports_after_insert();

-- seats_taken = the seats of the accepted requests
create or replace function public.ride_sync_taken(p_ride uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('qaryaty.rides_system', 'on', true);
  update public.rides
     set seats_taken = coalesce((select sum(seats) from public.ride_requests
                                  where ride_id = p_ride and status = 'accepted'), 0)
   where id = p_ride;
  perform set_config('qaryaty.rides_system', 'off', true);
end $$;

create or replace function public.request_ride(p_ride uuid, p_seats integer, p_phone text, p_note text)
returns public.ride_requests
language plpgsql security definer set search_path = public as $$
declare
  r public.rides;
  q public.ride_requests;
begin
  if auth.uid() is null then
    raise exception 'rides:sign_in' using errcode = 'P0001';
  end if;
  if public.is_blocked() then
    raise exception 'rides:blocked' using errcode = 'P0001';
  end if;
  select * into r from public.rides where id = p_ride for update;
  if r.id is null or r.status <> 'active' or r.expires_at <= now() then
    raise exception 'rides:not_active' using errcode = 'P0001';
  end if;
  if r.owner_id = auth.uid() then
    raise exception 'rides:own_ride' using errcode = 'P0001';
  end if;
  if coalesce(p_seats, 0) < 1 or p_seats > r.seats - r.seats_taken then
    raise exception 'rides:no_seats' using errcode = 'P0001';
  end if;
  if (select count(*) from public.ride_requests
       where requester_id = auth.uid() and updated_at > now() - interval '1 day') >= 20 then
    raise exception 'rides:too_many_requests' using errcode = 'P0001';
  end if;
  select * into q from public.ride_requests where ride_id = p_ride and requester_id = auth.uid() for update;
  if q.id is not null then
    if q.status in ('pending', 'accepted') then
      raise exception 'rides:already_requested' using errcode = 'P0001';
    elsif q.status = 'declined' then
      raise exception 'rides:declined' using errcode = 'P0001';
    end if;
    update public.ride_requests
       set seats = p_seats, phone = btrim(p_phone), note = btrim(coalesce(p_note, '')),
           requester_name = public.ride_short_name(auth.uid()),
           status = 'pending', created_at = now(), updated_at = now()
     where id = q.id returning * into q;
  else
    insert into public.ride_requests (ride_id, requester_id, requester_name, phone, seats, note)
    values (p_ride, auth.uid(), public.ride_short_name(auth.uid()), btrim(p_phone), p_seats, btrim(coalesce(p_note, '')))
    returning * into q;
  end if;
  return q;
end $$;

create or replace function public.respond_ride_request(p_id uuid, p_accept boolean)
returns public.ride_requests
language plpgsql security definer set search_path = public as $$
declare
  q public.ride_requests;
  r public.rides;
begin
  select * into q from public.ride_requests where id = p_id for update;
  if q.id is null then
    raise exception 'rides:request_not_found' using errcode = 'P0001';
  end if;
  select * into r from public.rides where id = q.ride_id for update;
  if r.owner_id <> auth.uid() then
    raise exception 'rides:request_not_found' using errcode = 'P0001';
  end if;
  if p_accept then
    if q.status <> 'pending' then
      raise exception 'rides:request_closed' using errcode = 'P0001';
    end if;
    if q.seats > r.seats - r.seats_taken then
      raise exception 'rides:no_seats' using errcode = 'P0001';
    end if;
    update public.ride_requests set status = 'accepted', updated_at = now() where id = p_id returning * into q;
  else
    if q.status not in ('pending', 'accepted') then
      raise exception 'rides:request_closed' using errcode = 'P0001';
    end if;
    update public.ride_requests set status = 'declined', updated_at = now() where id = p_id returning * into q;
  end if;
  perform public.ride_sync_taken(q.ride_id);
  return q;
end $$;

create or replace function public.cancel_ride_request(p_id uuid)
returns public.ride_requests
language plpgsql security definer set search_path = public as $$
declare
  q public.ride_requests;
begin
  select * into q from public.ride_requests where id = p_id for update;
  if q.id is null or q.requester_id <> auth.uid() then
    raise exception 'rides:request_not_found' using errcode = 'P0001';
  end if;
  if q.status not in ('pending', 'accepted') then
    raise exception 'rides:request_closed' using errcode = 'P0001';
  end if;
  perform 1 from public.rides where id = q.ride_id for update;
  update public.ride_requests set status = 'cancelled', updated_at = now() where id = p_id returning * into q;
  perform public.ride_sync_taken(q.ride_id);
  return q;
end $$;

create or replace function public.renew_ride(p_id uuid) returns public.rides
language plpgsql security definer set search_path = public as $$
declare
  r public.rides;
begin
  select * into r from public.rides where id = p_id for update;
  if r.id is null or r.owner_id <> auth.uid() then
    raise exception 'rides:not_found' using errcode = 'P0001';
  end if;
  if r.status = 'hidden' then
    raise exception 'rides:not_active' using errcode = 'P0001';
  end if;
  if r.schedule = 'once' then
    raise exception 'rides:once' using errcode = 'P0001';
  end if;
  if r.expires_at > now() + interval '7 days' then
    raise exception 'rides:too_early' using errcode = 'P0001';
  end if;
  perform set_config('qaryaty.rides_system', 'on', true);
  update public.rides set expires_at = now() + interval '30 days', updated_at = now()
   where id = p_id returning * into r;
  perform set_config('qaryaty.rides_system', 'off', true);
  return r;
end $$;

alter table public.rides         enable row level security;
alter table public.ride_requests enable row level security;
alter table public.ride_reports  enable row level security;

grant select on public.rides to anon, authenticated;
grant insert, update, delete on public.rides to authenticated;
-- Requests change only through the functions above
grant select on public.ride_requests to authenticated;
grant select, insert on public.ride_reports to authenticated;

revoke all on function public.request_ride(uuid, integer, text, text) from public, anon;
revoke all on function public.respond_ride_request(uuid, boolean) from public, anon;
revoke all on function public.cancel_ride_request(uuid) from public, anon;
revoke all on function public.renew_ride(uuid) from public, anon;
revoke all on function public.ride_sync_taken(uuid) from public, anon, authenticated;
revoke all on function public.ride_short_name(uuid) from public, anon, authenticated;
grant execute on function public.request_ride(uuid, integer, text, text) to authenticated;
grant execute on function public.respond_ride_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_ride_request(uuid) to authenticated;
grant execute on function public.renew_ride(uuid) to authenticated;
grant execute on function public.ride_owner(uuid), public.ride_has_my_request(uuid) to anon, authenticated;

drop policy if exists "rides: read live, own, joined or admin" on public.rides;
create policy "rides: read live, own, joined or admin" on public.rides for select to anon, authenticated
  using ((status = 'active' and expires_at > now()) or owner_id = auth.uid()
         or public.ride_has_my_request(id) or public.is_admin());

drop policy if exists "rides: post as yourself" on public.rides;
create policy "rides: post as yourself" on public.rides for insert to authenticated
  with check (owner_id = auth.uid() and not public.is_blocked());

drop policy if exists "rides: owner or admin edits" on public.rides;
create policy "rides: owner or admin edits" on public.rides for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "rides: owner or admin deletes" on public.rides;
create policy "rides: owner or admin deletes" on public.rides for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "ride requests: requester, ride owner or admin" on public.ride_requests;
create policy "ride requests: requester, ride owner or admin" on public.ride_requests for select to authenticated
  using (requester_id = auth.uid() or public.ride_owner(ride_id) = auth.uid() or public.is_admin());

drop policy if exists "ride reports: report a post once" on public.ride_reports;
create policy "ride reports: report a post once" on public.ride_reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.ride_owner(ride_id) <> auth.uid());

drop policy if exists "ride reports: own or admin" on public.ride_reports;
create policy "ride reports: own or admin" on public.ride_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
