-- Proposed only: reuse existing app_settings admin RLS and public-read policy.
-- Backup existing value/policies first. No grants, policy or payment changes.
begin;
insert into public.app_settings(key,value) values('appearance_enabled',1)
on conflict(key) do nothing;
commit;
