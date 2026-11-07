-- Rollback for 20261107030000_demo_mode.sql
begin;
delete from public.app_settings where key = 'demo_mode';
alter table public.shops     drop column if exists is_demo;
alter table public.providers drop column if exists is_demo;
alter table public.services  drop column if exists is_demo;
commit;
