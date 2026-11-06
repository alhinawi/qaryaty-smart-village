-- ─── وظائف: job posts from people and shops in the villages
-- Anyone signed in posts a job; it waits for an admin before it shows.
-- An approved post shows for 30 days, then the owner can renew it.
-- Three reports hide a post again until an admin looks at it.
--
--   jobs          the posts
--   job_reports   "بلّغ عن الإعلان" (one per person per post)
--   renew_job(id)            owner: 30 more days
--   admin_review_job(id, …)  admin: approve or reject

create table if not exists public.jobs (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title            text not null check (char_length(btrim(title)) between 3 and 80),
  employer         text not null check (char_length(btrim(employer)) between 2 and 80),
  village          text not null check (char_length(btrim(village)) between 2 and 120),
  job_type         text not null check (job_type in ('full_time', 'part_time', 'daily')),
  hours            text not null default '' check (char_length(hours) <= 80),
  salary           text not null default '' check (char_length(salary) <= 60),
  description      text not null check (char_length(btrim(description)) between 10 and 1000),
  contact_phone    text not null check (contact_phone ~ '^01[0125][0-9]{8}$'),
  contact_whatsapp boolean not null default true,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected', 'closed')),
  reject_reason    text check (char_length(reject_reason) <= 200),
  reports_count    integer not null default 0,
  expires_at       timestamptz,
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists jobs_public_idx on public.jobs (status, expires_at desc);
create index if not exists jobs_owner_idx on public.jobs (owner_id, created_at desc);

create table if not exists public.job_reports (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason      text not null check (reason in ('scam', 'fake', 'asks_money', 'other')),
  note        text not null default '' check (char_length(note) <= 300),
  created_at  timestamptz not null default now(),
  unique (job_id, reporter_id)
);

-- ─── The rules the app can't get around
-- The functions below (reports, renew) set qaryaty.jobs_system for their own
-- update only; the app can't set it (PostgREST exposes the public schema only).
create or replace function public.jobs_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  trusted boolean := coalesce(current_setting('qaryaty.jobs_system', true), '') = 'on';
  admin boolean := public.is_admin();
begin
  new.title := btrim(new.title);
  new.employer := btrim(new.employer);
  new.village := btrim(new.village);
  new.hours := btrim(coalesce(new.hours, ''));
  new.salary := btrim(coalesce(new.salary, ''));
  new.description := btrim(new.description);
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.owner_id := auth.uid();
    end if;
    if not admin and (select count(*) from public.jobs
                       where owner_id = new.owner_id and created_at > now() - interval '1 day') >= 5 then
      raise exception 'jobs:too_many' using errcode = 'P0001';
    end if;
    new.status := 'pending';
    new.reject_reason := null;
    new.reports_count := 0;
    new.expires_at := null;
    new.approved_at := null;
    new.created_at := now();
    return new;
  end if;

  -- UPDATE
  new.id := old.id;
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  if trusted then
    return new;
  end if;
  new.reports_count := old.reports_count;

  if admin then
    if new.status = 'approved' and old.status is distinct from 'approved' then
      new.approved_at := now();
      new.expires_at := now() + interval '30 days';
      new.reject_reason := null;
      new.reports_count := 0;
    end if;
    return new;
  end if;

  -- The owner: may close the post, or edit it (an edit goes back to review)
  new.expires_at := old.expires_at;
  new.approved_at := old.approved_at;
  new.reject_reason := old.reject_reason;
  if new.status = 'closed' then
    null;
  elsif (new.title, new.employer, new.village, new.job_type, new.hours, new.salary,
         new.description, new.contact_phone, new.contact_whatsapp)
        is distinct from
        (old.title, old.employer, old.village, old.job_type, old.hours, old.salary,
         old.description, old.contact_phone, old.contact_whatsapp)
     or old.status = 'closed' then
    new.status := 'pending';
    new.reject_reason := null;
  else
    new.status := old.status;
  end if;
  return new;
end $$;

drop trigger if exists jobs_before_write on public.jobs;
create trigger jobs_before_write
  before insert or update on public.jobs
  for each row execute function public.jobs_before_write();

-- A report counts on the post; the third hides it until an admin reviews it
create or replace function public.job_reports_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('qaryaty.jobs_system', 'on', true);
  update public.jobs
     set reports_count = reports_count + 1,
         status = case when reports_count + 1 >= 3 and status = 'approved' then 'pending' else status end
   where id = new.job_id;
  perform set_config('qaryaty.jobs_system', 'off', true);
  return null;
end $$;

drop trigger if exists job_reports_after_insert on public.job_reports;
create trigger job_reports_after_insert
  after insert on public.job_reports
  for each row execute function public.job_reports_after_insert();

-- ─── Owner: 30 more days for an approved post (from 7 days before it ends)
create or replace function public.renew_job(p_id uuid) returns public.jobs
language plpgsql security definer set search_path = public as $$
declare
  j public.jobs;
begin
  select * into j from public.jobs where id = p_id for update;
  if j.id is null or j.owner_id <> auth.uid() then
    raise exception 'jobs:not_found' using errcode = 'P0001';
  end if;
  if public.is_blocked() then
    raise exception 'jobs:blocked' using errcode = 'P0001';
  end if;
  if j.status <> 'approved' then
    raise exception 'jobs:not_approved' using errcode = 'P0001';
  end if;
  if j.expires_at > now() + interval '7 days' then
    raise exception 'jobs:too_early' using errcode = 'P0001';
  end if;
  perform set_config('qaryaty.jobs_system', 'on', true);
  update public.jobs set expires_at = now() + interval '30 days'
   where id = p_id returning * into j;
  perform set_config('qaryaty.jobs_system', 'off', true);
  return j;
end $$;

-- ─── Admin: approve or reject
create or replace function public.admin_review_job(p_id uuid, p_approve boolean, p_reason text default null)
returns public.jobs
language plpgsql security definer set search_path = public as $$
declare
  j public.jobs;
begin
  if not public.is_admin() then
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

-- ─── Privileges and RLS
revoke all on public.jobs from anon, authenticated;
revoke all on public.job_reports from anon, authenticated;
grant select on public.jobs to anon, authenticated;
grant insert (title, employer, village, job_type, hours, salary, description, contact_phone, contact_whatsapp)
  on public.jobs to authenticated;
grant update (title, employer, village, job_type, hours, salary, description, contact_phone, contact_whatsapp, status)
  on public.jobs to authenticated;
grant delete on public.jobs to authenticated;
grant select on public.job_reports to authenticated;
grant insert (job_id, reason, note) on public.job_reports to authenticated;

revoke all on function public.jobs_before_write() from public, anon, authenticated;
revoke all on function public.job_reports_after_insert() from public, anon, authenticated;
revoke all on function public.renew_job(uuid) from public, anon;
grant execute on function public.renew_job(uuid) to authenticated;
revoke all on function public.admin_review_job(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_job(uuid, boolean, text) to authenticated;

alter table public.jobs enable row level security;
alter table public.job_reports enable row level security;

drop policy if exists "jobs: read live, own or admin" on public.jobs;
drop policy if exists "jobs: post"                   on public.jobs;
drop policy if exists "jobs: edit own or admin"      on public.jobs;
drop policy if exists "jobs: delete own or admin"    on public.jobs;
create policy "jobs: read live, own or admin" on public.jobs for select to anon, authenticated
  using (
    (status = 'approved' and expires_at > now())
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );
create policy "jobs: post" on public.jobs for insert to authenticated
  with check (owner_id = (select auth.uid()) and not (select public.is_blocked()));
create policy "jobs: edit own or admin" on public.jobs for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check ((owner_id = (select auth.uid()) and not (select public.is_blocked())) or (select public.is_admin()));
create policy "jobs: delete own or admin" on public.jobs for delete to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "job reports: add"       on public.job_reports;
drop policy if exists "job reports: read"      on public.job_reports;
create policy "job reports: add" on public.job_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and not (select public.is_blocked())
    and exists (select 1 from public.jobs j
                 where j.id = job_id and j.status = 'approved' and j.expires_at > now()
                   and j.owner_id <> (select auth.uid()))
  );
create policy "job reports: read" on public.job_reports for select to authenticated
  using ((select public.is_admin()) or reporter_id = (select auth.uid()));
