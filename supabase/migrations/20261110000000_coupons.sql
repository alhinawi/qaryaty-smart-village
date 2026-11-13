-- ─── قسايم (coupons) ────────────────────────────────────────────────────────────────────────────────
-- Before: one hard-coded code, QARYA1 (orders_sane_values allowed nothing else).
-- Now: a coupons table the admin fills, and the order trigger checks and prices
-- every coupon itself. The app's numbers are never trusted: orders_before_insert
-- finds the coupon, locks its row (so two orders at once can't both take the last
-- use), checks every condition, works out the discount and writes it on the order.
--
-- Kinds (same rules as src/utils/coupons.ts):
--   waive_fees     عمولة التطبيق is not charged (QARYA1). The price is paid in full.
--   percent        value% off the items or the service price, up to max_discount.
--   fixed          value EGP off the items or the service price, never below 0.
--   free_delivery  رسوم التوصيل is not charged (shop orders only), up to max_discount.
-- The commission is always worked out on the full price (the discount is the app's).
-- A cancelled order gives its use back. Coupons with a per-account rule need a
-- signed-in customer.
--
-- On the order: coupon_id, discount_code (the code), discount_amount (all the
-- coupon saved), coupon_effect {items_off, commission_off, delivery_off},
-- commission_amount and delivery_fee as charged, total_amount as paid.
-- Coupons cost money, so only the admin and owner tiers manage them
-- (can_manage_coupons), not the orders or content supervisors.
-- Builds on 20261106210000_delivery_fee.sql. Safe to run again.

-- ─── Who manages coupons
create or replace function public.can_manage_coupons() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner') and not blocked
  );
$$;
revoke all on function public.can_manage_coupons() from public;
grant execute on function public.can_manage_coupons() to anon, authenticated, service_role;

-- ─── The table
create table if not exists public.coupons (
  id               bigint generated always as identity primary key,
  code             text not null,
  title            text not null,
  description      text not null default '',
  kind             text not null,
  value            numeric not null default 0,
  max_discount     numeric,
  min_order        numeric not null default 0,
  applies_to       text not null default 'both',
  shop_id          bigint references public.shops (id) on delete set null,
  first_order_only boolean not null default false,
  per_user_limit   integer,
  total_limit      integer,
  starts_at        timestamptz,
  ends_at          timestamptz,
  active           boolean not null default true,
  is_public        boolean not null default true,
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint coupons_code_format check (code ~ '^[A-Z0-9]{3,20}$'),
  constraint coupons_kind check (kind in ('waive_fees','percent','fixed','free_delivery')),
  constraint coupons_applies_to check (applies_to in ('products','services','both')),
  constraint coupons_value check (
    (kind = 'percent' and value > 0 and value <= 100)
    or (kind = 'fixed' and value > 0 and value <= 100000)
    or (kind in ('waive_fees','free_delivery') and value = 0)),
  constraint coupons_free_delivery_shops check (kind <> 'free_delivery' or applies_to = 'products'),
  constraint coupons_shop_products check (shop_id is null or applies_to = 'products'),
  constraint coupons_sane check (
    (max_discount is null or (max_discount > 0 and max_discount <= 100000))
    and min_order >= 0 and min_order <= 100000
    and (per_user_limit is null or per_user_limit >= 1)
    and (total_limit is null or total_limit >= 1)
    and (starts_at is null or ends_at is null or ends_at > starts_at)
    and length(title) between 2 and 80
    and length(description) <= 300)
);
create unique index if not exists coupons_code_key on public.coupons (code);

create or replace function public.coupons_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.code := upper(btrim(new.code));
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists coupons_touch on public.coupons;
create trigger coupons_touch before insert or update on public.coupons
  for each row execute function public.coupons_touch();

alter table public.coupons enable row level security;
drop policy if exists "coupons: anyone reads public" on public.coupons;
create policy "coupons: anyone reads public" on public.coupons for select
  using ((is_public and active) or public.can_manage_coupons());
drop policy if exists "coupons: admins write" on public.coupons;
create policy "coupons: admins write" on public.coupons for all to authenticated
  using (public.can_manage_coupons()) with check (public.can_manage_coupons());
revoke all on public.coupons from anon, authenticated;
grant select on public.coupons to anon, authenticated;
grant insert, update on public.coupons to authenticated; -- admins only (RLS); no delete: turn it off instead

-- QARYA1 as it works today: first order only, once per account, waives the commission
insert into public.coupons (code, title, description, kind, value, applies_to, first_order_only, per_user_limit, created_by)
values ('QARYA1', 'أول طلب من غير رسوم',
        'بتدفع تمن الحاجة أو الخدمة بس، ومفيش عمولة للتطبيق على أول طلب ليك.',
        'waive_fees', 0, 'both', true, 1, null)
on conflict (code) do nothing;

-- ─── Orders: any coupon code, linked to its row
alter table public.orders add column if not exists coupon_id bigint references public.coupons (id);
alter table public.orders add column if not exists coupon_effect jsonb;
-- orders that already used QARYA1 point at its row (keeps their first-order use)
update public.orders o set coupon_id = c.id
  from public.coupons c
 where o.discount_code is not null and o.coupon_id is null and c.code = upper(o.discount_code);
create index if not exists orders_coupon_user on public.orders (coupon_id, user_id) where coupon_id is not null;
-- per_user_limit replaces the one-use-per-code index (a coupon may allow more than one)
drop index if exists public.orders_one_promo_per_user;
alter table public.orders drop constraint if exists orders_sane_values;
alter table public.orders add constraint orders_sane_values check (
  discount_amount >= 0
  and (total_amount is null or total_amount >= 0)
  and commission_amount >= 0
  and (discount_code is null or length(discount_code) <= 20)
  and (discount_code is null) = (coupon_id is null)
  and length(order_number) <= 40
  and length(service_name) <= 300
  and length(service_emoji) <= 40
  and length(address) <= 300
  and length(coalesce(notes, '')) <= 1000
  and pg_column_size(options) <= 8000
  and (coupon_effect is null or pg_column_size(coupon_effect) <= 500)
);

-- ─── The rule: one coupon on one order
-- Returns {ok, message} or {ok, items_off, commission_off, delivery_off}.
-- p_items: the items or the service price (null: set after confirmation);
-- p_commission and p_delivery: the server's own numbers for that order.
-- p_lock: the order trigger locks the coupon row so the limits hold under load.
-- security definer: counts everyone's uses for total_limit. It only answers for
-- the caller's own account.
create or replace function public.coupon_apply(
  p_coupon_id bigint, p_user uuid, p_target text, p_shop_id bigint,
  p_items numeric, p_commission numeric, p_delivery numeric, p_lock boolean)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  c         public.coupons;
  used_mine integer := 0;
  used_all  integer := 0;
  has_order boolean := false;
  items     numeric := coalesce(p_items, 0);
  items_off numeric := 0;
  comm_off  numeric := 0;
  deliv_off numeric := 0;
  shop_name text;
  fail      text;
begin
  -- (security definer: current_user is the owner here, so ask the request's role)
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and p_user is distinct from auth.uid() then
    raise exception 'not your account' using errcode = '42501';
  end if;
  if p_lock then
    select * into c from public.coupons where id = p_coupon_id for update;
  else
    select * into c from public.coupons where id = p_coupon_id;
  end if;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'الكود ده مش صحيح');
  end if;

  if p_user is not null then
    select count(*) into used_mine from public.orders
     where coupon_id = c.id and user_id = p_user and status <> 'cancelled';
    select exists (select 1 from public.orders where user_id = p_user and status <> 'cancelled') into has_order;
  end if;
  if c.total_limit is not null then
    select count(*) into used_all from public.orders where coupon_id = c.id and status <> 'cancelled';
  end if;
  if c.shop_id is not null then
    select s.name into shop_name from public.shops s where s.id = c.shop_id;
  end if;

  -- Same order and words as couponProblem() in src/utils/coupons.ts
  fail := case
    when not c.active then 'الكوبون ده متوقف دلوقتي'
    when c.starts_at is not null and c.starts_at > now() then
      'الكوبون ده لسه مابدأش، هيشتغل من ' || to_char(c.starts_at at time zone 'Africa/Cairo', 'DD/MM')
    when c.ends_at is not null and c.ends_at <= now() then 'الكوبون ده خلصت مدته'
    when c.applies_to <> 'both' and c.applies_to <> p_target then
      case when c.applies_to = 'products' then 'الكوبون ده لطلبات المحلات بس' else 'الكوبون ده للخدمات بس' end
    when c.shop_id is not null and c.shop_id is distinct from p_shop_id then
      case when shop_name is not null then 'الكوبون ده لطلبات ' || shop_name || ' بس' else 'الكوبون ده لمحل تاني' end
    when (c.first_order_only or c.per_user_limit is not null) and p_user is null then
      'سجّل دخول الأول علشان تستخدم الكوبون ده'
    when c.first_order_only and has_order then 'الكوبون ده لأول طلب بس، وإنت طلبت قبل كده'
    when c.per_user_limit is not null and used_mine >= c.per_user_limit then
      case when c.per_user_limit = 1 then 'إنت استخدمت الكوبون ده قبل كده'
           else 'إنت استخدمت الكوبون ده ' || c.per_user_limit || ' مرات، وده آخره' end
    when c.total_limit is not null and used_all >= c.total_limit then 'الكوبون ده خلص، اتستخدم لآخر عدد'
    when c.min_order > 0 and items < c.min_order then
      'الكوبون ده لطلب من ' || trim_scale(c.min_order) || ' ج أو أكتر'
    when c.kind in ('percent','fixed') and p_items is null then
      'الكوبون ده محتاج طلب سعره معروف، والسعر هنا بيتحدد بعد التأكيد'
    when c.kind = 'free_delivery' and coalesce(p_delivery, 0) <= 0 then 'مفيش رسوم توصيل على الطلب ده'
  end;
  if fail is not null then
    return jsonb_build_object('ok', false, 'message', fail);
  end if;

  -- Same sums as couponEffect() in src/utils/coupons.ts
  case c.kind
    when 'waive_fees' then
      comm_off := greatest(coalesce(p_commission, 0), 0);
      if c.max_discount is not null then comm_off := least(comm_off, c.max_discount); end if;
    when 'percent' then
      items_off := round(items * c.value / 100);
      if c.max_discount is not null then items_off := least(items_off, c.max_discount); end if;
      items_off := least(items_off, items);
    when 'fixed' then
      items_off := c.value;
      if c.max_discount is not null then items_off := least(items_off, c.max_discount); end if;
      items_off := least(items_off, items);
    when 'free_delivery' then
      deliv_off := greatest(coalesce(p_delivery, 0), 0);
      if c.max_discount is not null then deliv_off := least(deliv_off, c.max_discount); end if;
  end case;

  return jsonb_build_object('ok', true,
    'items_off', greatest(items_off, 0), 'commission_off', comm_off, 'delivery_off', deliv_off);
end $$;
revoke all on function public.coupon_apply(bigint, uuid, text, bigint, numeric, numeric, numeric, boolean) from public;
-- the order trigger runs as the customer, so the customer roles call it (for their own account only)
grant execute on function public.coupon_apply(bigint, uuid, text, bigint, numeric, numeric, numeric, boolean)
  to anon, authenticated, service_role;

-- A code's coupon id, hidden and stopped ones too (for the order trigger)
create or replace function public.coupon_id_by_code(p_code text) returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.coupons where code = upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'))
$$;
revoke all on function public.coupon_id_by_code(text) from public;
grant execute on function public.coupon_id_by_code(text) to anon, authenticated, service_role;

-- ─── The app's check before the order: the same rule, with the server's own commission
-- and delivery fee for that price and shop. The trigger checks again on insert.
create or replace function public.coupon_quote(p_code text, p_target text, p_shop_id bigint, p_items numeric)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  c        public.coupons;
  result   jsonb;
  delivery numeric := 0;
begin
  if coalesce(btrim(p_code), '') = '' then
    return jsonb_build_object('ok', false, 'message', 'اكتب الكود الأول');
  end if;
  if p_target not in ('products','services') then
    raise exception 'bad target' using errcode = '22023';
  end if;
  select * into c from public.coupons where code = upper(regexp_replace(p_code, '\s', '', 'g'));
  if not found then
    return jsonb_build_object('ok', false, 'message', 'الكود ده مش صحيح');
  end if;
  if p_target = 'products' and p_shop_id is not null then
    delivery := public.delivery_fee_quote(p_shop_id);
  end if;
  result := public.coupon_apply(c.id, auth.uid(), p_target, p_shop_id, p_items,
                                public.order_commission(null, p_items, false), delivery, false);
  if (result->>'ok')::boolean then
    result := result || jsonb_build_object('coupon',
      to_jsonb(c) - 'created_by' - 'created_at' - 'updated_at'
      || jsonb_build_object('shop_name', (select s.name from public.shops s where s.id = c.shop_id)));
  end if;
  return result;
end $$;
revoke all on function public.coupon_quote(text, text, bigint, numeric) from public;
grant execute on function public.coupon_quote(text, text, bigint, numeric) to anon, authenticated, service_role;

-- ─── قسايمي: the public coupons (and any the caller used), with the caller's use.
-- Ended ones stay 30 days, greyed out in the app.
create or replace function public.my_coupons()
returns setof jsonb language sql stable security definer set search_path = public as $$
  with me as (
    select auth.uid() as uid,
           exists (select 1 from public.orders o where o.user_id = auth.uid() and o.status <> 'cancelled') as has_orders
  ), usage as (
    select c.id,
           (select count(*) from public.orders o, me
             where o.coupon_id = c.id and o.user_id = me.uid and o.status <> 'cancelled') as used_by_me,
           case when c.total_limit is null then false
                else (select count(*) from public.orders o where o.coupon_id = c.id and o.status <> 'cancelled') >= c.total_limit
           end as sold_out
      from public.coupons c
  )
  select to_jsonb(c) - 'created_by' - 'created_at' - 'updated_at'
         || jsonb_build_object(
              'shop_name', (select s.name from public.shops s where s.id = c.shop_id),
              'used_by_me', u.used_by_me, 'sold_out', u.sold_out, 'has_orders', me.has_orders)
    from public.coupons c join usage u on u.id = c.id cross join me
   where (c.is_public or u.used_by_me > 0)
     and (c.active or u.used_by_me > 0)
     and (c.ends_at is null or c.ends_at > now() - interval '30 days')
   order by c.id
$$;
revoke all on function public.my_coupons() from public;
grant execute on function public.my_coupons() to anon, authenticated, service_role;

-- ─── Admin: every coupon with how much it was used
create or replace function public.admin_coupons()
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_coupons() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  return query
    select to_jsonb(c) - 'created_by'
           || jsonb_build_object(
                'shop_name', (select s.name from public.shops s where s.id = c.shop_id),
                'uses', count(o.id), 'users', count(distinct o.user_id),
                'saved', coalesce(sum(o.discount_amount), 0), 'last_used_at', max(o.created_at))
      from public.coupons c
      left join public.orders o on o.coupon_id = c.id and o.status <> 'cancelled'
     group by c.id
     order by c.active desc, c.id desc;
end $$;
revoke all on function public.admin_coupons() from public;
grant execute on function public.admin_coupons() to authenticated, service_role;

-- ─── The order trigger: the same as 20261106210000, plus the coupon
create or replace function public.orders_before_insert() returns trigger
language plpgsql set search_path = public as $$
declare
  shop       public.shops;
  item       jsonb;
  product    public.catalog_products;
  qty        numeric;
  grill      boolean;
  unit_price numeric;
  line       numeric;
  subtotal   numeric := 0;
  priced     jsonb := '[]'::jsonb;
  names      text[] := '{}';
  price_part numeric;
  fee        numeric;  -- عمولة التطبيق on the full price, before any coupon
  delivery   numeric := 0;
  coupon_row public.coupons;
  effect     jsonb;
  items_off  numeric := 0;
  comm_off   numeric := 0;
  deliv_off  numeric := 0;
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
    new.service_name := left(shop.name || ': ' || array_to_string(names, ' + '), 300);
    new.service_emoji := left(coalesce(shop.emoji, ''), 40);
    price_part := subtotal;
    fee := public.order_commission(null, subtotal, false);
    delivery := public.delivery_fee_quote(new.shop_id);
  else
    -- A service order: never a delivery fee of ours (a provider's own, like the
    -- gas cylinder's, is inside the price the app sends). The app sends the price
    -- plus the commission it showed; take its commission out and work out our own.
    -- A null total (price set after confirmation) stays null with no commission;
    -- a waive_fees coupon stays on the order, so the commission stays waived later.
    price_part := case when new.total_amount is null then null
                       else greatest(new.total_amount - greatest(coalesce(new.commission_amount, 0), 0), 0) end;
    fee := public.order_commission(null, price_part, new.is_estimate);
    delivery := 0;
  end if;

  -- The coupon: found by its code, locked, checked and priced here only
  new.coupon_id := null;
  new.coupon_effect := null;
  new.discount_code := nullif(upper(regexp_replace(coalesce(new.discount_code, ''), '\s', '', 'g')), '');
  if new.discount_code is not null then
    -- (the customer can't read hidden or stopped coupons, so look it up as the owner)
    coupon_row.id := public.coupon_id_by_code(new.discount_code);
    if coupon_row.id is null then
      raise exception 'coupon: الكود ده مش صحيح' using errcode = 'P0001';
    end if;
    effect := public.coupon_apply(coupon_row.id, new.user_id,
                case when new.shop_id is not null then 'products' else 'services' end,
                new.shop_id, price_part, fee, delivery, true);
    if not (effect->>'ok')::boolean then
      raise exception 'coupon: %', effect->>'message' using errcode = 'P0001';
    end if;
    items_off := (effect->>'items_off')::numeric;
    comm_off  := (effect->>'commission_off')::numeric;
    deliv_off := (effect->>'delivery_off')::numeric;
    new.coupon_id := coupon_row.id;
    new.coupon_effect := effect - 'ok';
  end if;

  new.discount_amount := items_off + comm_off + deliv_off;
  new.commission_amount := greatest(fee - comm_off, 0);
  new.delivery_fee := greatest(delivery - deliv_off, 0);
  new.total_amount := case when price_part is null then null
                           else greatest(price_part - items_off, 0) + new.commission_amount + new.delivery_fee end;

  -- Card and wallet need a known amount to charge
  if new.payment_method in ('card','wallet')
     and (new.is_estimate or new.total_amount is null or new.total_amount <= 0) then
    raise exception 'online payment needs a fixed price' using errcode = '22023';
  end if;
  return new;
end $$;

revoke all on function public.orders_before_insert() from public, anon, authenticated;
