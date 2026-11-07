-- ─── الأكتر طلبًا في القرية هذا الأسبوع: weekly order aggregation ─────────
-- PREPARED 2026-11-07, NOT APPLIED. Backup first, apply after owner OK.
-- Depends on 20261107030000_demo_mode.sql (shops.is_demo) — apply after it.
--
-- SECURITY DEFINER is required: RLS lets each customer read only their own
-- orders, so an aggregate over all orders must bypass it. The function
-- exposes ONLY per-shop order counts (no customer data, no order details).
create or replace function public.weekly_top_shops(p_limit int default 5)
returns table (shop_id bigint, order_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select o.shop_id, count(*) as order_count
  from public.orders o
  join public.shops s on s.id = o.shop_id
  where o.created_at >= now() - interval '7 days'
    and o.status <> 'cancelled'
    and o.shop_id is not null
    and s.hidden = false
    -- real mode counts only real shops; demo mode counts everything
    and (
      coalesce((select value from public.app_settings where key = 'demo_mode'), 1) = 1
      or s.is_demo = false
    )
  group by o.shop_id
  order by order_count desc, o.shop_id
  limit greatest(p_limit, 1);
$$;

-- Aggregate counts only; callable by anyone like the public catalog.
grant execute on function public.weekly_top_shops(int) to anon, authenticated;
