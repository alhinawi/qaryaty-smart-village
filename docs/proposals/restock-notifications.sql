-- REVIEW DRAFT ONLY. NOT APPLIED. NOT A COMPLETE FEATURE.
-- Verify live schema and ownership/RLS first. Requires explicit SQL approval.
-- Staging tables only. No client grants for insertion; final RPCs must validate
-- shop/product/availability and rate limits. Never install a quantity trigger.
begin;
create table public.restock_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  shop_id bigint not null references public.shops(id) on delete cascade,
  product_id text not null check (length(product_id) between 1 and 160),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  unique(profile_id, shop_id, product_id)
);
create table public.restock_notices (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.restock_subscriptions(id),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  shop_id bigint not null references public.shops(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index restock_active_product on public.restock_subscriptions(shop_id,product_id) where active;
create index restock_notices_owner on public.restock_notices(profile_id,created_at desc);
alter table public.restock_subscriptions enable row level security;
alter table public.restock_notices enable row level security;
revoke all on public.restock_subscriptions,public.restock_notices from anon,authenticated;
grant select on public.restock_subscriptions,public.restock_notices to authenticated;
create policy restock_subscriptions_self on public.restock_subscriptions for select to authenticated using(profile_id=auth.uid());
create policy restock_notices_self on public.restock_notices for select to authenticated using(profile_id=auth.uid());
-- No UPDATE grant, to avoid letting customers change message/recipient fields.
-- Read/cancel/subscribe must use narrow RPCs, not arbitrary direct updates.
commit;
-- Rollback AFTER disabling feature and exporting new rows:
-- begin;
-- drop table public.restock_notices;
-- drop table public.restock_subscriptions;
-- commit;
-- No existing table/policy is changed by this staging proposal.
