-- Rollback for 20261107060000_weekly_top_shops.sql
begin;
drop function if exists public.weekly_top_shops(integer);
commit;
