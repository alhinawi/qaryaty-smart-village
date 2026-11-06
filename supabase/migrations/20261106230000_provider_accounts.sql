-- ─── Provider accounts: link app users to their shop/provider record and let
-- their dashboard edits reach customers ─────────────────────────────────────
-- PREPARED 2026-11-06, NOT APPLIED. Backup first: /downloads/qaryati-backup-20261106
-- Additive only: new columns, one new table, new policies. Nothing deleted.
-- Apply AFTER 20261106220000_supervisor_tiers.sql.

-- 1) Ownership link: which account manages this shop / this provider
alter table public.shops     add column if not exists owner_profile_id uuid references public.profiles (id);
alter table public.providers add column if not exists owner_profile_id uuid references public.profiles (id);
create index if not exists shops_owner_idx     on public.shops (owner_profile_id);
create index if not exists providers_owner_idx on public.providers (owner_profile_id);

-- 2) The owner of the record edits their own row; staff keep their existing
--    "catalog: admins edit" policies. Customers keep read-only.
create policy "shops: owner edits own" on public.shops for update
  using (owner_profile_id = auth.uid()) with check (owner_profile_id = auth.uid());
create policy "providers: owner edits own" on public.providers for update
  using (owner_profile_id = auth.uid()) with check (owner_profile_id = auth.uid());

-- 3) Per-shop product prices and availability. Today catalog_products is
--    shared per shop kind, so one shop's price can't differ from another's;
--    this table holds each shop's own numbers and wins when present.
create table if not exists public.shop_product_overrides (
  shop_id    bigint not null references public.shops (id) on delete cascade,
  product_id text   not null,
  price      numeric check (price is null or price >= 0),
  photo_url  text,
  available  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (shop_id, product_id)
);
alter table public.shop_product_overrides enable row level security;
create policy "overrides: anyone reads" on public.shop_product_overrides for select using (true);
create policy "overrides: shop owner edits" on public.shop_product_overrides for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()));
create policy "overrides: staff edit" on public.shop_product_overrides for all
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.shop_product_overrides to authenticated;
grant select on public.shop_product_overrides to anon;

-- 4) What the dashboard edits today in localStorage gets a home:
--    working days/hours and the custom services list for professionals
alter table public.providers add column if not exists availability jsonb;      -- {"days":["sat",...],"from":"09:00","to":"21:00"}
alter table public.providers add column if not exists custom_services jsonb;   -- [{"id","name","price","active"}]

-- 5) Products a merchant adds themselves (لوحة مقدم الخدمة → ضيف منتج)
create table if not exists public.shop_custom_products (
  id         uuid primary key default gen_random_uuid(),
  shop_id    bigint not null references public.shops (id) on delete cascade,
  name       text not null,
  price      numeric not null check (price >= 0),
  unit       text not null default 'قطعة',
  section    text not null default '',
  emoji      text not null default '📦',
  photo_url  text,
  available  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists shop_custom_products_shop_idx on public.shop_custom_products (shop_id);
alter table public.shop_custom_products enable row level security;
create policy "custom products: anyone reads" on public.shop_custom_products for select using (true);
create policy "custom products: shop owner edits" on public.shop_custom_products for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()));
create policy "custom products: staff edit" on public.shop_custom_products for all
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.shop_custom_products to authenticated;
grant select on public.shop_custom_products to anon;

-- 6) Shop and product photos: one public bucket, each shop writes only inside
--    its own folder (shop-images/<shop_id>/…), 2 MB max, jpeg/png/webp only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-images', 'shop-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "shop images: anyone reads" on storage.objects for select
  using (bucket_id = 'shop-images');
create policy "shop images: shop owner writes own folder" on storage.objects for insert
  with check (
    bucket_id = 'shop-images'
    and exists (
      select 1 from public.shops s
      where s.id = ((storage.foldername(name))[1])::bigint
        and s.owner_profile_id = auth.uid()
    )
  );
create policy "shop images: shop owner updates own folder" on storage.objects for update
  using (
    bucket_id = 'shop-images'
    and exists (
      select 1 from public.shops s
      where s.id = ((storage.foldername(name))[1])::bigint
        and s.owner_profile_id = auth.uid()
    )
  );
create policy "shop images: shop owner deletes own folder" on storage.objects for delete
  using (
    bucket_id = 'shop-images'
    and exists (
      select 1 from public.shops s
      where s.id = ((storage.foldername(name))[1])::bigint
        and s.owner_profile_id = auth.uid()
    )
  );
create policy "shop images: staff manage" on storage.objects for all
  using (bucket_id = 'shop-images' and public.is_admin())
  with check (bucket_id = 'shop-images' and public.is_admin());
