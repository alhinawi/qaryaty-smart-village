-- PROPOSED ONLY. Restore BEFORE downgrading client. Save live function first.
begin;
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


-- Keep historical order item snapshots and columns; disable structured offers without data deletion.
update public.daily_offers set stopped_at=now() where product_id is not null and stopped_at is null;
drop function if exists public.stop_product_offer(bigint);
drop function if exists public.publish_product_offer(bigint,text,text,integer,text,numeric);
create policy "offers: merchant writes own shop" on public.daily_offers for insert to authenticated
 with check(exists(select 1 from public.shops s where s.id=shop_id and s.owner_profile_id=auth.uid()));
create policy "offers: merchant stops own" on public.daily_offers for update to authenticated
 using(exists(select 1 from public.shops s where s.id=shop_id and s.owner_profile_id=auth.uid()))
 with check(exists(select 1 from public.shops s where s.id=shop_id and s.owner_profile_id=auth.uid()));
grant insert,update on public.daily_offers to authenticated;
commit;
