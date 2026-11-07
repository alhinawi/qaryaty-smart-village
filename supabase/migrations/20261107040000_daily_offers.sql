-- ─── عروض اليوم: merchant-set time-limited offers with a home-page countdown ─
-- PREPARED 2026-11-07, NOT APPLIED. Backup first, apply after owner OK.
-- Offers are created only by the shop's own merchant account; they are hidden
-- (never deleted) when stopped or expired, and the app hides offers of demo
-- shops in real mode. No payment/commission change: the offer is display text.

begin;

create table if not exists public.daily_offers (
  id         bigint generated always as identity primary key,
  shop_id    bigint not null references public.shops (id) on delete cascade,
  title      text not null check (length(btrim(title)) between 3 and 80),
  details    text not null default '' check (length(details) <= 120),
  ends_at    timestamptz not null,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  constraint daily_offers_sane_duration check (ends_at > created_at and ends_at <= created_at + interval '24 hours')
);
create index if not exists daily_offers_active on public.daily_offers (ends_at) where stopped_at is null;

alter table public.daily_offers enable row level security;

-- Everyone sees running offers (the app additionally filters expired/hidden shops)
create policy "offers: anyone reads" on public.daily_offers for select
  using (true);
-- Only the shop's own merchant account creates/stops its offers
create policy "offers: merchant writes own shop" on public.daily_offers for insert to authenticated
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()));
create policy "offers: merchant stops own" on public.daily_offers for update to authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()));

grant select on public.daily_offers to anon, authenticated;
grant insert, update on public.daily_offers to authenticated;

commit;
