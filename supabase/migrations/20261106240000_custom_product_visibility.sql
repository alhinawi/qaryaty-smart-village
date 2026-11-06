-- ─── Custom products stay hidden from customers until they have a photo ────
-- PREPARED 2026-11-06, NOT APPLIED. Backup first: /downloads/qaryati-backup-20261106-preapply
-- Rule from the owner: the merchant saves the product now and adds the photo
-- later; it goes public the moment a photo lands. Replaces the open read
-- policy from 20261106230000_provider_accounts.sql (applied).

begin;

drop policy if exists "custom products: anyone reads" on public.shop_custom_products;

-- Customers see only what is available and photographed
create policy "custom products: public reads visible" on public.shop_custom_products for select
  using (available and photo_url is not null);

-- The shop's own account still sees everything it added (photo pending or not)
create policy "custom products: shop owner reads own" on public.shop_custom_products for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_profile_id = auth.uid()));

-- Staff see everything
create policy "custom products: staff read" on public.shop_custom_products for select
  using (public.is_admin());

commit;
