-- ─── واتساب الطلبات: merchant WhatsApp on every new order ───────────────────
-- PREPARED 2026-11-07, NOT APPLIED. Backup first, apply after owner OK.
-- Sending itself needs a paid WhatsApp Business provider (Meta direct / Twilio /
-- a BSP) — this migration only prepares the data and the secure accept flow.
-- Design: a trigger enqueues every new order for the shop's opted-in WhatsApp
-- number; a sender worker (Supabase Edge Function + pg_cron, or the existing
-- push-hook pattern) drains the queue through the provider API. The message
-- carries a one-time accept link; accepting marks the order confirmed through
-- a security-definer function that burns the token. No payment/commission change.

begin;

-- 0) Master switch, DEFAULT OFF (app_settings.whatsapp_notifications): the
-- owner turns it on from لوحة التحكم when a paid provider is wired. While it
-- is off the trigger below queues nothing — no provider calls, no spend.
insert into public.app_settings (key, value) values ('whatsapp_notifications', 0)
on conflict (key) do nothing;

-- 1) The merchant's WhatsApp number + explicit opt-in (shops only for now)
alter table public.shops add column if not exists whatsapp_phone text
  check (whatsapp_phone is null or whatsapp_phone ~ '^01[0125][0-9]{8}$');
alter table public.shops add column if not exists whatsapp_opt_in boolean not null default false;

-- 2) One-time accept token per order (the «قبول الطلب» link in the message)
alter table public.orders add column if not exists accept_token uuid not null default gen_random_uuid();

-- 3) Outbound queue: one row per message to send, drained by the sender worker
create table if not exists public.order_whatsapp_queue (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  shop_id     bigint not null references public.shops (id) on delete cascade,
  phone       text not null,
  body        text not null,
  status      text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts    integer not null default 0,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
alter table public.order_whatsapp_queue enable row level security;
-- No client reads/writes: the trigger writes, the sender worker (service role) drains.
-- Staff can watch the queue from the dashboard:
create policy "wa queue: staff read" on public.order_whatsapp_queue for select
  using (public.is_admin());
grant select on public.order_whatsapp_queue to authenticated;

create or replace function public.enqueue_order_whatsapp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_shop public.shops;
  v_body text;
begin
  -- Master switch first: OFF means nothing is queued, whatever the shop chose.
  if coalesce((select value from public.app_settings where key = 'whatsapp_notifications'), 0) <> 1 then
    return new;
  end if;
  if new.shop_id is null then return new; end if;
  select * into v_shop from public.shops where id = new.shop_id;
  if v_shop.whatsapp_opt_in is not true or v_shop.whatsapp_phone is null then return new; end if;
  v_body := '🛒 طلب جديد من قريتي!' || E'\n\n'
    || 'الطلب: ' || left(new.service_name, 120) || E'\n'
    || 'العنوان: ' || left(new.address, 160) || E'\n'
    || 'الموبايل: ' || new.phone || E'\n'
    || 'الإجمالي: ' || coalesce(new.total_amount::text, 'هيتحدد بعد التأكيد') || ' جنيه' || E'\n\n'
    || 'دوس «قبول الطلب» عشان تبدأ تجهزه: https://qaryaty.vercel.app/orders/' || new.id || '/accept?t=' || new.accept_token;
  insert into public.order_whatsapp_queue (order_id, shop_id, phone, body) values (new.id, new.shop_id, v_shop.whatsapp_phone, v_body);
  return new;
end;
$$;

drop trigger if exists orders_enqueue_whatsapp on public.orders;
create trigger orders_enqueue_whatsapp after insert on public.orders
  for each row execute function public.enqueue_order_whatsapp();

-- 4) One-time accept: the token link confirms a still-pending order, once
create or replace function public.accept_order_by_token(p_order uuid, p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.orders
  set status = 'confirmed', accept_token = gen_random_uuid() -- burn the token
  where id = p_order and accept_token = p_token and status = 'pending';
  if not found then
    return jsonb_build_object('accepted', false);
  end if;
  return jsonb_build_object('accepted', true);
end;
$$;
revoke all on function public.accept_order_by_token(uuid, uuid) from public, anon;
grant execute on function public.accept_order_by_token(uuid, uuid) to anon, authenticated;

commit;
