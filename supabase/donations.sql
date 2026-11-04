-- ─── باب الخير: "عايز أتبرع" requests from the /donate page
-- Run after schema.sql (it uses public.is_admin() and public.is_blocked()). Safe to run again.
--
-- What's stored and who sees it:
--   public.donation_requests  one row per form: who wants to give, their phone, the cause and
--                             what they want to give (money, clothes, furniture, food, other).
--                             Only admins read or change it. Visitors, signed in or not, add a
--                             row only through public.submit_donation_request(), which checks
--                             everything again. No money goes through the app.
--
-- To see the requests: Supabase → Table Editor → donation_requests (newest first by created_at).
-- status: new → contacted → done (or cancelled). admin_note is for your own notes.

-- ─── Table
create table if not exists public.donation_requests (
  id            uuid primary key,
  created_at    timestamptz not null default now(),
  donor_name    text not null check (char_length(donor_name) between 2 and 80),
  phone         text not null check (phone ~ '^01[0125][0-9]{8}$'),
  -- The cause's id in src/config/donations.ts, and its name when the request was sent
  cause         text not null check (cause ~ '^[a-z][a-z-]{1,39}$'),
  cause_name    text not null check (char_length(cause_name) between 2 and 80),
  donation_type text not null check (donation_type in ('money','clothes','furniture','food','other')),
  notes         text check (notes is null or char_length(notes) <= 500),
  user_id       uuid references auth.users (id) on delete set null,
  status        text not null default 'new' check (status in ('new','contacted','done','cancelled')),
  admin_note    text check (admin_note is null or char_length(admin_note) <= 500),
  handled_at    timestamptz
);

create index if not exists donation_requests_created_idx on public.donation_requests (created_at desc);
create index if not exists donation_requests_phone_idx on public.donation_requests (phone);

alter table public.donation_requests enable row level security;

revoke all on public.donation_requests from public, anon, authenticated;
grant select, delete on public.donation_requests to authenticated;
grant update (status, admin_note, handled_at) on public.donation_requests to authenticated;

drop policy if exists "donation requests: admins read"   on public.donation_requests;
drop policy if exists "donation requests: admins update" on public.donation_requests;
drop policy if exists "donation requests: admins delete" on public.donation_requests;
create policy "donation requests: admins read"   on public.donation_requests for select to authenticated
  using (public.is_admin());
create policy "donation requests: admins update" on public.donation_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "donation requests: admins delete" on public.donation_requests for delete to authenticated
  using (public.is_admin());

-- ─── The only way in: checks the fields and the limits
-- Errors the form understands (in the message): donation:bad_input, donation:blocked,
-- donation:too_many_open (3 open requests per phone), donation:busy (30 requests a 10 minutes).
create or replace function public.submit_donation_request(
  p_id uuid,
  p_donor_name text,
  p_phone text,
  p_cause text,
  p_cause_name text,
  p_donation_type text,
  p_notes text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_donor_name, ''), '\s+', ' ', 'g'));
  v_cause_name text := btrim(regexp_replace(coalesce(p_cause_name, ''), '\s+', ' ', 'g'));
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  if p_id is null
     or char_length(v_name) not between 2 and 80
     or coalesce(p_phone, '') !~ '^01[0125][0-9]{8}$'
     or coalesce(p_cause, '') !~ '^[a-z][a-z-]{1,39}$'
     or char_length(v_cause_name) not between 2 and 80
     or coalesce(p_donation_type, '') not in ('money','clothes','furniture','food','other')
     or char_length(coalesce(v_notes, '')) > 500 then
    raise exception 'donation:bad_input' using errcode = '22023';
  end if;

  if public.is_blocked() then
    raise exception 'donation:blocked' using errcode = '42501';
  end if;

  -- One at a time, so the limits below can't be raced past
  perform pg_advisory_xact_lock(hashtext('public.donation_requests'));

  if (select count(*) from public.donation_requests
      where phone = p_phone and status in ('new','contacted')) >= 3 then
    raise exception 'donation:too_many_open' using errcode = '22023';
  end if;

  if (select count(*) from public.donation_requests
      where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'donation:busy' using errcode = '22023';
  end if;

  insert into public.donation_requests (id, donor_name, phone, cause, cause_name, donation_type, notes, user_id)
  values (p_id, v_name, p_phone, p_cause, v_cause_name, p_donation_type, v_notes, auth.uid());

  return p_id;
end $$;

revoke all on function public.submit_donation_request(uuid, text, text, text, text, text, text) from public;
grant execute on function public.submit_donation_request(uuid, text, text, text, text, text, text)
  to anon, authenticated;
