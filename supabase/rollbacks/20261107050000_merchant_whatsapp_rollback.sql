-- Rollback for 20261107050000_merchant_whatsapp.sql
begin;
drop trigger if exists orders_enqueue_whatsapp on public.orders;
drop function if exists public.enqueue_order_whatsapp();
drop function if exists public.accept_order_by_token(uuid, uuid);
drop table if exists public.order_whatsapp_queue;
alter table public.orders drop column if exists accept_token;
alter table public.shops drop column if exists whatsapp_opt_in;
alter table public.shops drop column if exists whatsapp_phone;
delete from public.app_settings where key = 'whatsapp_notifications';
commit;
