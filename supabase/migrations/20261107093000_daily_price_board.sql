-- PROPOSED ONLY. Apply after live schema/privileges check and backup.
-- Announcements do NOT alter product prices, orders, fees or balances.
begin;
create table public.daily_merchant_prices (
 id uuid primary key default gen_random_uuid(),
 shop_id bigint not null references public.shops(id),
 item text not null check(length(item) between 1 and 80 and item=btrim(item)),
 unit text not null check(length(unit) between 1 and 30 and unit=btrim(unit)),
 price numeric(10,2) not null check(price>0 and price<=100000),
 available boolean not null default true,
 updated_at timestamptz not null default now(),
 unique(shop_id,item,unit)
);
alter table public.daily_merchant_prices enable row level security;
revoke all on public.daily_merchant_prices from anon,authenticated;
create index daily_prices_latest on public.daily_merchant_prices(updated_at desc) where available;

create function public.list_daily_prices(p_shop bigint default null) returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from (
 select p.id, p.shop_id as "shopId", s.name as "shopName",p.item,p.unit,p.price,p.updated_at as "updatedAt"
 from public.daily_merchant_prices p join public.shops s on s.id=p.shop_id
 where (p_shop is null or p.shop_id=p_shop) and p.available and not s.hidden and s.is_demo=false
 and p.updated_at<=now()
 and (p.updated_at at time zone 'Africa/Cairo')::date=(now() at time zone 'Africa/Cairo')::date
 and exists(select 1 from public.profiles pr where pr.id=s.owner_profile_id and not pr.blocked)
 order by p.updated_at desc,p.id limit 100
 ) r;
$$;

create function public.publish_daily_price(p_shop bigint,p_item text,p_unit text,p_price numeric) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from profiles where id=auth.uid() and not blocked) then
  raise exception 'not allowed' using errcode='42501'; end if;
 -- The row lock also serializes the per-shop cap across concurrent requests.
 perform 1 from shops where id=p_shop and owner_profile_id=auth.uid() and not hidden and is_demo=false for update;
 if not found then raise exception 'not allowed' using errcode='42501';end if;
 if p_item is null or length(btrim(p_item)) not between 1 and 80 or p_unit is null or length(btrim(p_unit)) not between 1 and 30
 or p_price is null or p_price::text in ('NaN','Infinity','-Infinity') or p_price<=0 or p_price>100000 or p_price<>round(p_price,2) then
 raise exception 'invalid announcement' using errcode='22023';end if;
 if not exists(select 1 from daily_merchant_prices where shop_id=p_shop and item=btrim(p_item) and unit=btrim(p_unit))
 and (select count(*) from daily_merchant_prices where shop_id=p_shop)>=40 then
 raise exception 'shop announcement limit reached' using errcode='22023';end if;
 insert into daily_merchant_prices(shop_id,item,unit,price,updated_at) values(p_shop,btrim(p_item),btrim(p_unit),p_price,now())
 on conflict(shop_id,item,unit) do update set price=excluded.price,updated_at=now(),available=true;
end;
$$;

create function public.withdraw_daily_price(p_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from profiles where id=auth.uid() and not blocked) then
 raise exception 'not allowed' using errcode='42501';end if;
 update daily_merchant_prices p set available=false where p.id=p_id
 and exists(select 1 from shops s where s.id=p.shop_id and s.owner_profile_id=auth.uid() and not s.hidden and s.is_demo=false);
 if not found then raise exception 'not allowed' using errcode='42501';end if;
end;
$$;
revoke all on function public.list_daily_prices(bigint) from public;
revoke all on function public.publish_daily_price(bigint,text,text,numeric) from public;
revoke all on function public.withdraw_daily_price(uuid) from public;
grant execute on function public.list_daily_prices(bigint) to anon,authenticated;
grant execute on function public.publish_daily_price(bigint,text,text,numeric),public.withdraw_daily_price(uuid) to authenticated;
commit;
