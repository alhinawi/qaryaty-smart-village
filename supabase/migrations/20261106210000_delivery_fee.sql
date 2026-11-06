-- ─── رسوم التوصيل on shop orders ─────────────────────────────────────────────────────
-- A cart order from a shop or restaurant (the customer gets a product brought to
-- him) now pays a delivery fee, on its own line and in its own column
-- (orders.delivery_fee), added to total_amount, so Paymob charges it too.
-- Service orders (plumber, teacher, nurse, the gas cylinder…) never get it: a
-- provider's own delivery fee (الأنبوبة) stays inside the service price as before.
--
-- Where the number comes from (public.delivery_fee_quote):
--   • app_settings 'delivery_fee_default': the fee inside the village (10 EGP).
--   • shops.delivery_fee: a shop's own fee instead of the default (null: default).
--   • villages.delivery_fee: a farther village's fee (null: none). The customer's
--     village is profiles.village_id; when it has a fee, the order pays the higher
--     of it and the shop's fee. Guests pay the shop's fee.
-- Admins change all three (RLS: is_admin()). The app reads the same function to
-- show the number, and the order trigger uses it, so they always agree.
--
-- QARYA1 waives عمولة التطبيق only, never the delivery fee (it goes to the
-- courier), and the commission stays on the items' price only.
-- Same rule as getCartPricing in src/utils/pricing.ts. Safe to run again.

-- ─── Settings
create table if not exists public.app_settings (
  key        text primary key,
  value      numeric not null,
  updated_at timestamptz not null default now(),
  constraint app_settings_sane check (value >= 0 and value <= 10000 and length(key) <= 60)
);
alter table public.app_settings enable row level security;
drop policy if exists "app_settings: anyone reads" on public.app_settings;
create policy "app_settings: anyone reads" on public.app_settings for select using (true);
drop policy if exists "app_settings: admins write" on public.app_settings;
create policy "app_settings: admins write" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated; -- admins only (RLS)

-- Same number as DELIVERY_FEE_DEFAULT in src/config/delivery.ts (only the first time:
-- a value an admin changed is kept)
insert into public.app_settings (key, value) values ('delivery_fee_default', 10)
  on conflict (key) do nothing;

alter table public.shops add column if not exists delivery_fee numeric;
alter table public.shops drop constraint if exists shops_delivery_fee_sane;
alter table public.shops add constraint shops_delivery_fee_sane
  check (delivery_fee is null or (delivery_fee >= 0 and delivery_fee <= 1000));

alter table public.villages add column if not exists delivery_fee numeric;
alter table public.villages drop constraint if exists villages_delivery_fee_sane;
alter table public.villages add constraint villages_delivery_fee_sane
  check (delivery_fee is null or (delivery_fee >= 0 and delivery_fee <= 1000));

alter table public.orders add column if not exists delivery_fee numeric not null default 0;
alter table public.orders drop constraint if exists orders_delivery_fee_sane;
alter table public.orders add constraint orders_delivery_fee_sane
  check (delivery_fee >= 0 and (delivery_fee = 0 or shop_id is not null));

-- ─── The fee for one shop order by the caller
-- security definer: reads the caller's own village and the settings whatever the
-- RLS; it only ever answers with a number for the person asking.
create or replace function public.delivery_fee_quote(p_shop_id bigint)
returns numeric language sql stable security definer set search_path = public as $$
  with base as (
    select coalesce(
             (select s.delivery_fee from public.shops s where s.id = p_shop_id),
             (select a.value from public.app_settings a where a.key = 'delivery_fee_default'),
             10) as fee
  ), far as (
    select v.delivery_fee as fee
      from public.profiles p join public.villages v on v.id = p.village_id
     where p.id = auth.uid()
  )
  select greatest((select fee from base), coalesce((select fee from far), 0))
$$;
revoke all on function public.delivery_fee_quote(bigint) from public;
grant execute on function public.delivery_fee_quote(bigint) to anon, authenticated, service_role;

-- ─── The order trigger: the same as 20261106190000, plus the delivery fee
create or replace function public.orders_before_insert() returns trigger
language plpgsql set search_path = public as $$
declare
  shop      public.shops;
  item      jsonb;
  product   public.catalog_products;
  qty       numeric;
  grill     boolean;
  unit_price numeric;
  line      numeric;
  subtotal  numeric := 0;
  priced    jsonb := '[]'::jsonb;
  names     text[] := '{}';
  price_part numeric;
  fee       numeric;  -- عمولة التطبيق before the QARYA1 waiver
  grill_per_kilo constant numeric := 40;  -- GRILL_PRICE_PER_KILO in src/data/catalog.ts
begin
  if current_user in ('anon', 'authenticated') then
    new.status := 'pending';
    new.created_at := now();
    new.payment_status := 'unpaid';
    new.paymob_order_id := null;
    new.paid_at := null;
  end if;

  if new.shop_id is not null then
    select * into shop from public.shops where id = new.shop_id;
    if not found then
      raise exception 'unknown shop' using errcode = '23503';
    end if;
    if new.items is null or jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then
      raise exception 'a shop order needs items' using errcode = '22023';
    end if;

    for item in select * from jsonb_array_elements(new.items) loop
      select * into product from public.catalog_products
        where scope = public.shop_scope(shop) and product_id = item->>'product_id';
      if not found then
        -- also stops a cart that mixes two shops: the other shop's items aren't here
        raise exception 'item % is not sold by this shop', item->>'product_id' using errcode = '22023';
      end if;
      qty := (item->>'quantity')::numeric;
      grill := coalesce((item->>'grill')::boolean, false);
      if qty is null or qty <= 0 or qty > 100 or mod(qty, product.step) <> 0 then
        raise exception 'bad quantity for %', product.product_id using errcode = '22023';
      end if;
      if grill and not product.grillable then
        raise exception '% can''t be grilled', product.product_id using errcode = '22023';
      end if;
      unit_price := product.price + case when grill then grill_per_kilo else 0 end;
      line := round(unit_price * qty, 2);
      subtotal := subtotal + line;
      priced := priced || jsonb_build_object(
        'product_id', product.product_id, 'name', product.name, 'unit', product.unit,
        'quantity', qty, 'grill', grill, 'unit_price', unit_price, 'line_total', line);
      names := names || (product.name || case when grill then ' مشوي' else '' end);
    end loop;

    new.items := priced;
    new.service_id := null;
    new.provider_id := null;
    new.is_estimate := false;
    -- Same rule as the app (utils/pricing.ts): the items are paid in full and
    -- QARYA1 waives the commission only. The commission is on the items only;
    -- رسوم التوصيل comes on top, worked out here, and QARYA1 doesn't touch it.
    fee := public.order_commission(new.discount_code, subtotal, false);
    new.discount_amount := case when new.discount_code = 'QARYA1' then fee else 0 end;
    new.commission_amount := case when new.discount_code = 'QARYA1' then 0 else fee end;
    new.delivery_fee := public.delivery_fee_quote(new.shop_id);
    new.total_amount := subtotal + new.commission_amount + new.delivery_fee;
    new.service_name := left(shop.name || ': ' || array_to_string(names, ' + '), 300);
    new.service_emoji := left(coalesce(shop.emoji, ''), 40);
  else
    -- A service order: never a delivery fee of ours (a provider's own, like the
    -- gas cylinder's, is inside the price the app sends).
    -- The app's total holds the price and the commission it showed. Take the
    -- app's commission out and add the server's own instead, so it can't be
    -- dropped or lowered. QARYA1 waives it (discount_amount records how much);
    -- the price itself is paid in full. A null total (price set after
    -- confirmation) stays null with no commission; a QARYA1 order keeps its
    -- code, so the commission stays waived when the price is set.
    -- (greatest() skips nulls, so keep a null total null by hand)
    new.delivery_fee := 0;
    price_part := case when new.total_amount is null then null
                       else greatest(new.total_amount - greatest(coalesce(new.commission_amount, 0), 0), 0) end;
    fee := public.order_commission(new.discount_code, price_part, new.is_estimate);
    new.discount_amount := case when new.discount_code = 'QARYA1' then fee else 0 end;
    new.commission_amount := case when new.discount_code = 'QARYA1' then 0 else fee end;
    new.total_amount := price_part + new.commission_amount;
  end if;

  -- Card and wallet need a known amount to charge
  if new.payment_method in ('card','wallet')
     and (new.is_estimate or new.total_amount is null or new.total_amount <= 0) then
    raise exception 'online payment needs a fixed price' using errcode = '22023';
  end if;
  return new;
end $$;

revoke all on function public.orders_before_insert() from public, anon, authenticated;
