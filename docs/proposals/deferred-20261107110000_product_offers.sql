-- PROPOSED ONLY / NOT APPLIED. Requires daily_offers + delivery_fee migrations.
-- Backup live functions/policies/table definitions and reconcile any later production changes before applying.
begin;
alter table public.daily_offers add column if not exists product_id text;
alter table public.daily_offers add column if not exists percent_off numeric;
alter table public.daily_offers add column if not exists starts_at timestamptz;
update public.daily_offers set starts_at=created_at where starts_at is null;
alter table public.daily_offers alter column starts_at set default now();
alter table public.daily_offers alter column starts_at set not null;
-- Retire old text-only ads at rollout so a textual percentage cannot look like a real discount.
-- Preserve every row for audit; merchant must create a structured offer.
update public.daily_offers set stopped_at=now() where product_id is null and stopped_at is null;
alter table public.daily_offers add constraint daily_offers_product_percent check (
 (product_id is null and percent_off is null) or
 (product_id is not null and length(product_id)>0 and percent_off between 1 and 99 and percent_off=trunc(percent_off))
);
alter table public.daily_offers add constraint daily_offers_start_end check(starts_at<ends_at);
-- Merchant writes use atomic function only. Direct writes could forge arbitrary product IDs/overlaps.
drop policy if exists "offers: merchant writes own shop" on public.daily_offers;
drop policy if exists "offers: merchant stops own" on public.daily_offers;
revoke insert,update on public.daily_offers from anon,authenticated;
create or replace function public.publish_product_offer(p_shop_id bigint,p_title text,p_details text,p_hours integer,p_product_id text,p_percent_off numeric)
returns setof public.daily_offers language plpgsql security definer set search_path=public as $$
declare s public.shops;
begin
 perform pg_advisory_xact_lock(p_shop_id);
 select * into s from public.shops where id=p_shop_id for update;
 if not found or auth.uid() is null or s.owner_profile_id is distinct from auth.uid() then
  raise exception 'not your shop' using errcode='42501';
 end if;
 if p_product_id is null or p_hours is null or p_hours not in (2,3,4,6) or p_percent_off is null or p_percent_off<1 or p_percent_off>99 or p_percent_off<>trunc(p_percent_off)
 or not exists(select 1 from public.catalog_products where scope=public.shop_scope(s) and product_id=p_product_id) then
  raise exception 'invalid offer product or percent/duration' using errcode='22023';
 end if;
 update public.daily_offers set stopped_at=now() where shop_id=p_shop_id and stopped_at is null;
 return query insert into public.daily_offers(shop_id,title,details,starts_at,ends_at,product_id,percent_off)
 values(p_shop_id,btrim(p_title),coalesce(btrim(p_details),''),now(),now()+make_interval(hours=>p_hours),p_product_id,p_percent_off) returning *;
end $$;
revoke all on function public.publish_product_offer(bigint,text,text,integer,text,numeric) from public,anon;
grant execute on function public.publish_product_offer(bigint,text,text,integer,text,numeric) to authenticated;
create or replace function public.stop_product_offer(p_offer_id bigint)
returns void language plpgsql security definer set search_path=public as $$
declare sid bigint; owner_id uuid;
begin
 select shop_id into sid from public.daily_offers where id=p_offer_id;
 if sid is null then raise exception 'unknown offer' using errcode='22023';end if;
 perform pg_advisory_xact_lock(sid);
 select owner_profile_id into owner_id from public.shops where id=sid;
 if auth.uid() is null or owner_id is distinct from auth.uid() then raise exception 'not your shop' using errcode='42501';end if;
 update public.daily_offers set stopped_at=now() where id=p_offer_id and stopped_at is null;
end $$;
revoke all on function public.stop_product_offer(bigint) from public,anon;
grant execute on function public.stop_product_offer(bigint) to authenticated;
create or replace function public.orders_before_insert() returns trigger
language plpgsql set search_path = public as $$
declare
  shop      public.shops;
  item      jsonb;
  product   public.catalog_products;
  qty       numeric;
  grill     boolean;
  unit_price numeric;
  original_unit_price numeric;
  active_offer public.daily_offers;
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
      -- Lock shop during quote/order: serializes against atomic offer replacement/stop.
      perform pg_advisory_xact_lock_shared(new.shop_id);
      active_offer := null;
      select * into active_offer from public.daily_offers
       where shop_id=new.shop_id and product_id=product.product_id and stopped_at is null
         and starts_at<=now() and ends_at>now() and percent_off between 1 and 99
       order by created_at desc,id desc limit 1;
      original_unit_price := product.price + case when grill then grill_per_kilo else 0 end;
      unit_price := (case when active_offer.id is not null then round(product.price*(100-active_offer.percent_off)/100,2)
                    else product.price end) + case when grill then grill_per_kilo else 0 end;
      -- Reject missing/stale client consent. Client must refresh and customer confirm again.
      if item->>'expected_unit_price' is null or (item->>'expected_unit_price')::numeric is distinct from unit_price
         or (item->>'expected_offer_id') is distinct from (case when active_offer.id is null then null else 'offer_'||active_offer.id end) then
        raise exception 'OFFER_PRICE_CHANGED: refresh cart and confirm price' using errcode='22023';
      end if;
      line := round(unit_price * qty, 2);
      subtotal := subtotal + line;
      priced := priced || jsonb_build_object(
        'product_id', product.product_id, 'name', product.name, 'unit', product.unit,
        'quantity', qty, 'grill', grill, 'original_unit_price', original_unit_price, 'unit_price', unit_price,
        'offer_id',active_offer.id,'offer_percent',active_offer.percent_off,'line_total', line);
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


revoke all on function public.orders_before_insert() from public,anon,authenticated;
commit;
