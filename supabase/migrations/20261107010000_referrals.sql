-- ─── Real referrals: personal link, attribution, points ledger ─────────────
-- PREPARED 2026-11-07, NOT APPLIED. Backup first, apply after owner OK.
-- Proposed rewards (owner to confirm): 50 points to the inviter after the
-- invited friend's FIRST completed (done) order, 25 welcome points to the
-- invited friend on claiming. 200 points = a free order on the existing scale.

begin;

-- 1) Every account gets a shareable code; who invited this account
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

update public.profiles
set referral_code = coalesce(nullif(username, ''), 'q' || substr(md5(id::text), 1, 7))
where referral_code is null;

alter table public.profiles alter column referral_code set not null;
create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);

-- New accounts get their code at sign-up (the username when there is one)
create or replace function public.set_referral_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referral_code is null then
    new.referral_code := coalesce(nullif(new.username, ''), 'q' || substr(md5(new.id::text), 1, 7));
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code before insert on public.profiles
  for each row execute function public.set_referral_code();

-- 2) Append-only points ledger; writes happen only through the functions below
create table if not exists public.points_ledger (
  id             bigint generated always as identity primary key,
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  points         integer not null,
  reason         text not null check (reason in ('referral_welcome', 'referral_reward')),
  ref_profile_id uuid references public.profiles (id),
  ref_order_id   uuid references public.orders (id),
  created_at     timestamptz not null default now()
);
alter table public.points_ledger enable row level security;
create policy "points: user reads own" on public.points_ledger for select
  using (auth.uid() = profile_id);
create policy "points: staff read all" on public.points_ledger for select
  using (public.is_admin());
grant select on public.points_ledger to authenticated;

-- 3) Claiming a code: once per account, never your own, unknown codes rejected
create or replace function public.claim_referral(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_referrer uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  select id into v_referrer from public.profiles where referral_code = lower(trim(p_code));
  if v_referrer is null then return jsonb_build_object('claimed', false, 'reason', 'bad_code'); end if;
  if v_referrer = v_me then return jsonb_build_object('claimed', false, 'reason', 'self'); end if;
  update public.profiles set referred_by = v_referrer where id = v_me and referred_by is null;
  if not found then return jsonb_build_object('claimed', false, 'reason', 'already'); end if;
  insert into public.points_ledger (profile_id, points, reason, ref_profile_id)
  values (v_me, 25, 'referral_welcome', v_referrer);
  return jsonb_build_object('claimed', true);
end;
$$;

-- 4) The inviter earns only when the friend's FIRST order reaches "done"
create or replace function public.reward_referral_on_done()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_referrer uuid;
  v_done_count integer;
begin
  if new.status = 'done' and old.status is distinct from 'done' and new.user_id is not null then
    select referred_by into v_referrer from public.profiles where id = new.user_id;
    if v_referrer is not null then
      select count(*) into v_done_count from public.orders
      where user_id = new.user_id and status = 'done';
      if v_done_count = 1 then
        insert into public.points_ledger (profile_id, points, reason, ref_profile_id, ref_order_id)
        values (v_referrer, 50, 'referral_reward', new.user_id, new.id);
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_reward_referral on public.orders;
create trigger orders_reward_referral after update of status on public.orders
  for each row execute function public.reward_referral_on_done();

commit;
