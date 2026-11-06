-- ─── بيع المستعمل وتبادل: used things people sell or swap in the villages
-- One engine for both: market_listings.kind is 'sale' or 'swap'.
-- A post goes live at once (no waiting for an admin) and shows for 30 days,
-- then the owner renews it. Anyone can report a post; the third report hides it
-- until an admin looks at it. Admins can hide, restore or delete any post.
--
--   market_listings        the posts
--   market_reports         "بلّغ عن الإعلان" (one per person per post)
--   market_messages        buyer ↔ owner messages, one thread per post and buyer
--   renew_market_listing(id)          owner: 30 more days
--   market_conversations()            my threads, newest first, with unread counts
--   mark_market_thread_read(id, buyer) the other side's messages read
--   storage bucket market-photos      public photos, each person writes only <uid>/…

create table if not exists public.market_listings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  owner_name    text not null default '',
  kind          text not null check (kind in ('sale', 'swap')),
  title         text not null check (char_length(btrim(title)) between 3 and 80),
  category      text not null check (category in ('devices', 'phones', 'furniture', 'clothes',
                                                  'vehicles', 'tools', 'books', 'kids', 'other')),
  condition     text not null check (condition in ('new', 'good', 'used')),
  village       text not null check (char_length(btrim(village)) between 2 and 80),
  description   text not null default '' check (char_length(description) <= 1000),
  price         integer check (price between 1 and 50000000),
  negotiable    boolean not null default false,
  wanted        text not null default '' check (char_length(wanted) <= 200),
  photos        text[] not null default '{}' check (cardinality(photos) <= 5),
  contact_phone text check (contact_phone ~ '^01[0125][0-9]{8}$'),
  status        text not null default 'active' check (status in ('active', 'sold', 'swapped', 'hidden')),
  reports_count integer not null default 0,
  expires_at    timestamptz not null default now() + interval '30 days',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- A sale has a price; a swap says what it wants instead
  constraint market_kind_fields check (
    (kind = 'sale' and price is not null)
    or (kind = 'swap' and price is null and char_length(btrim(wanted)) >= 2)
  ),
  constraint market_done_status check (
    (status <> 'sold' or kind = 'sale') and (status <> 'swapped' or kind = 'swap')
  )
);

create index if not exists market_public_idx on public.market_listings (kind, status, created_at desc);
create index if not exists market_owner_idx on public.market_listings (owner_id, created_at desc);

create table if not exists public.market_reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.market_listings(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason      text not null check (reason in ('scam', 'fake', 'prohibited', 'sold', 'other')),
  note        text not null default '' check (char_length(note) <= 300),
  created_at  timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

create table if not exists public.market_messages (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  -- The person asking about the post: the thread is (listing_id, buyer_id)
  buyer_id   uuid not null references auth.users(id) on delete cascade,
  sender_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists market_messages_thread_idx on public.market_messages (listing_id, buyer_id, created_at);
create index if not exists market_messages_buyer_idx on public.market_messages (buyer_id, created_at desc);

-- ─── Helpers (security definer: they read past RLS, return only what's needed)
create or replace function public.market_listing_owner(p_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select owner_id from public.market_listings where id = p_id;
$$;

create or replace function public.market_listing_is_live(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.market_listings
                  where id = p_id and status = 'active' and expires_at > now());
$$;

-- ─── The rules the app can't get around
-- Functions below set qaryaty.market_system for their own update only; the app
-- can't set it (PostgREST exposes the public schema only).
create or replace function public.market_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  trusted boolean := coalesce(current_setting('qaryaty.market_system', true), '') = 'on';
  admin boolean := public.is_admin();
  p text;
begin
  new.title := btrim(new.title);
  new.village := btrim(new.village);
  new.description := btrim(coalesce(new.description, ''));
  new.wanted := btrim(coalesce(new.wanted, ''));
  new.photos := coalesce(new.photos, '{}');
  new.updated_at := now();
  if new.kind = 'swap' then
    new.price := null;
    new.negotiable := false;
  else
    new.wanted := '';
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.owner_id := auth.uid();
    end if;
    if public.is_blocked() then
      raise exception 'market:blocked' using errcode = 'P0001';
    end if;
    if not admin and (select count(*) from public.market_listings
                       where owner_id = new.owner_id and created_at > now() - interval '1 day') >= 10 then
      raise exception 'market:too_many' using errcode = 'P0001';
    end if;
    new.owner_name := coalesce((select split_part(btrim(name), ' ', 1) || coalesce(' ' || nullif(split_part(btrim(name), ' ', 2), ''), '')
                                  from public.profiles where id = new.owner_id), '');
    new.status := 'active';
    new.reports_count := 0;
    new.expires_at := now() + interval '30 days';
    new.created_at := now();
  else
    -- UPDATE
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.owner_name := old.owner_name;
    new.kind := old.kind;
    new.created_at := old.created_at;
    if trusted then
      return new;
    end if;
    if admin then
      -- Restoring a hidden post clears its reports
      if new.status = 'active' and old.status = 'hidden' then
        new.reports_count := 0;
        delete from public.market_reports where listing_id = old.id;
      else
        new.reports_count := old.reports_count;
      end if;
    else
      new.reports_count := old.reports_count;
      new.expires_at := old.expires_at;
      -- The owner marks it sold/swapped or puts it back; a hidden post stays hidden
      if old.status = 'hidden' then
        new.status := 'hidden';
      elsif new.status = 'hidden' then
        new.status := old.status;
      end if;
    end if;
  end if;

  -- Photos are paths in the owner's own folder of the bucket
  foreach p in array new.photos loop
    if p !~ ('^' || new.owner_id::text || '/[A-Za-z0-9_-]{1,80}\.(jpg|jpeg|png|webp)$') then
      raise exception 'market:bad_photo' using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists market_before_write on public.market_listings;
create trigger market_before_write
  before insert or update on public.market_listings
  for each row execute function public.market_before_write();

-- A report counts on the post; the third hides it until an admin reviews it
create or replace function public.market_reports_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('qaryaty.market_system', 'on', true);
  update public.market_listings
     set reports_count = reports_count + 1,
         status = case when reports_count + 1 >= 3 and status = 'active' then 'hidden' else status end
   where id = new.listing_id;
  perform set_config('qaryaty.market_system', 'off', true);
  return null;
end $$;

drop trigger if exists market_reports_after_insert on public.market_reports;
create trigger market_reports_after_insert
  after insert on public.market_reports
  for each row execute function public.market_reports_after_insert();

-- Messages: the sender is whoever is signed in; 60 an hour at most
create or replace function public.market_messages_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.sender_id := auth.uid();
  new.body := btrim(new.body);
  new.read_at := null;
  new.created_at := now();
  if (select count(*) from public.market_messages
       where sender_id = new.sender_id and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'market:too_many_messages' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists market_messages_before_insert on public.market_messages;
create trigger market_messages_before_insert
  before insert on public.market_messages
  for each row execute function public.market_messages_before_insert();

-- ─── Owner: 30 more days (from 7 days before the post ends, or after it ended)
create or replace function public.renew_market_listing(p_id uuid) returns public.market_listings
language plpgsql security definer set search_path = public as $$
declare
  l public.market_listings;
begin
  select * into l from public.market_listings where id = p_id for update;
  if l.id is null or l.owner_id <> auth.uid() then
    raise exception 'market:not_found' using errcode = 'P0001';
  end if;
  if l.status <> 'active' then
    raise exception 'market:not_active' using errcode = 'P0001';
  end if;
  if l.expires_at > now() + interval '7 days' then
    raise exception 'market:too_early' using errcode = 'P0001';
  end if;
  perform set_config('qaryaty.market_system', 'on', true);
  update public.market_listings set expires_at = now() + interval '30 days', updated_at = now()
   where id = p_id returning * into l;
  perform set_config('qaryaty.market_system', 'off', true);
  return l;
end $$;

-- ─── My threads: one row per (post, buyer), newest first
create or replace function public.market_conversations()
returns table (
  listing_id uuid, listing_title text, listing_kind text, listing_photo text,
  buyer_id uuid, other_name text, i_am_owner boolean,
  last_body text, last_at timestamptz, last_from_me boolean, unread integer
)
language sql stable security definer set search_path = public as $$
  with mine as (
    select m.*, l.owner_id, l.title, l.kind, l.photos, l.owner_name
      from public.market_messages m
      join public.market_listings l on l.id = m.listing_id
     where m.buyer_id = auth.uid() or l.owner_id = auth.uid()
  ),
  last as (
    select distinct on (listing_id, buyer_id) * from mine
     order by listing_id, buyer_id, created_at desc
  )
  select t.listing_id, t.title, t.kind, t.photos[1], t.buyer_id,
         case when t.owner_id = auth.uid()
              then coalesce((select split_part(btrim(p.name), ' ', 1) from public.profiles p where p.id = t.buyer_id), '')
              else t.owner_name end,
         t.owner_id = auth.uid(),
         t.body, t.created_at, t.sender_id = auth.uid(),
         (select count(*)::int from mine u
           where u.listing_id = t.listing_id and u.buyer_id = t.buyer_id
             and u.sender_id <> auth.uid() and u.read_at is null)
    from last t
   order by t.created_at desc
   limit 100;
$$;

create or replace function public.mark_market_thread_read(p_listing uuid, p_buyer uuid) returns void
language sql security definer set search_path = public as $$
  update public.market_messages set read_at = now()
   where listing_id = p_listing and buyer_id = p_buyer
     and sender_id <> auth.uid() and read_at is null
     and (buyer_id = auth.uid() or public.market_listing_owner(p_listing) = auth.uid());
$$;

-- ─── Access
alter table public.market_listings enable row level security;
alter table public.market_reports  enable row level security;
alter table public.market_messages enable row level security;

grant select on public.market_listings to anon, authenticated;
grant insert, update, delete on public.market_listings to authenticated;
grant insert on public.market_reports to authenticated;
grant select on public.market_reports to authenticated;
grant select, insert on public.market_messages to authenticated;
revoke all on function public.renew_market_listing(uuid) from public, anon;
revoke all on function public.market_conversations() from public, anon;
revoke all on function public.mark_market_thread_read(uuid, uuid) from public, anon;
grant execute on function public.renew_market_listing(uuid) to authenticated;
grant execute on function public.market_conversations() to authenticated;
grant execute on function public.mark_market_thread_read(uuid, uuid) to authenticated;
grant execute on function public.market_listing_owner(uuid), public.market_listing_is_live(uuid) to authenticated;

drop policy if exists "market: read live, own or admin" on public.market_listings;
create policy "market: read live, own or admin" on public.market_listings for select to anon, authenticated
  using ((status = 'active' and expires_at > now()) or owner_id = auth.uid() or public.is_admin());

drop policy if exists "market: post as yourself" on public.market_listings;
create policy "market: post as yourself" on public.market_listings for insert to authenticated
  with check (owner_id = auth.uid() and not public.is_blocked());

drop policy if exists "market: owner or admin edits" on public.market_listings;
create policy "market: owner or admin edits" on public.market_listings for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "market: owner or admin deletes" on public.market_listings;
create policy "market: owner or admin deletes" on public.market_listings for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "market reports: report a live post once" on public.market_reports;
create policy "market reports: report a live post once" on public.market_reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.market_listing_owner(listing_id) <> auth.uid());

drop policy if exists "market reports: own or admin" on public.market_reports;
create policy "market reports: own or admin" on public.market_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "market messages: the two sides read" on public.market_messages;
create policy "market messages: the two sides read" on public.market_messages for select to authenticated
  using (buyer_id = auth.uid() or public.market_listing_owner(listing_id) = auth.uid());

-- A buyer writes about a live post that isn't theirs; the owner answers a buyer who wrote first
drop policy if exists "market messages: buyer asks, owner answers" on public.market_messages;
create policy "market messages: buyer asks, owner answers" on public.market_messages for insert to authenticated
  with check (
    sender_id = auth.uid() and not public.is_blocked() and (
      (buyer_id = auth.uid()
        and public.market_listing_owner(listing_id) <> auth.uid()
        and public.market_listing_is_live(listing_id))
      or (public.market_listing_owner(listing_id) = auth.uid()
        and buyer_id <> auth.uid()
        and exists (select 1 from public.market_messages q
                     where q.listing_id = market_messages.listing_id
                       and q.buyer_id = market_messages.buyer_id
                       and q.sender_id = market_messages.buyer_id))
    )
  );

-- ─── Photos: public bucket, ~3 MB images; each person writes only in <their id>/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('market-photos', 'market-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "market photos: upload to own folder" on storage.objects;
create policy "market photos: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'market-photos' and (storage.foldername(name))[1] = auth.uid()::text
              and not public.is_blocked());

drop policy if exists "market photos: change own" on storage.objects;
create policy "market photos: change own" on storage.objects for update to authenticated
  using (bucket_id = 'market-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'market-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "market photos: delete own or admin" on storage.objects;
create policy "market photos: delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'market-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Reading a row back after an upload (the JS client does) needs a select policy
drop policy if exists "market photos: read own" on storage.objects;
create policy "market photos: read own" on storage.objects for select to authenticated
  using (bucket_id = 'market-photos' and (storage.foldername(name))[1] = auth.uid()::text);
