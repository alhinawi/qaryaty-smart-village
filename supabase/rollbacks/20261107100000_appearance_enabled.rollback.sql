-- Rollback for 20261107100000_appearance_enabled.sql
begin;
delete from public.app_settings where key = 'appearance_enabled';
commit;
