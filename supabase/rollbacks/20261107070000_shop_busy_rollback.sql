-- Rollback for 20261107070000_shop_busy.sql
begin;
alter table public.shops drop column if exists busy_until;
alter table public.shops drop column if exists is_busy;
commit;
