-- Rollback for 20261107040000_daily_offers.sql
begin;
drop table if exists public.daily_offers;
commit;
