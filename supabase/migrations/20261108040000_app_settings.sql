-- ─── إعدادات التطبيق المشتركة (app_settings) — أول إعداد: شكل شارة «خلصان» ───
-- PREPARED 2026-11-08, NOT APPLIED. Run only after the owner says OK.
-- Why: the owner picks the out-of-stock badge style from لوحة التحكم
-- («تغميق الصورة» أو «شريط أحمر»). Today the choice persists per device
-- (localStorage fallback, already working). This table makes the pick global:
-- every device reads it on load and follows the owner's choice.
-- Shape: generic key/value so future owner settings reuse it (no new table
-- per setting).
-- Backup before running:
--   create table if not exists backups.app_settings_20261108 as
--     select * from public.app_settings;   -- empty if the table is new
-- Rollback:
--   delete from public.app_settings where key = 'oos_badge_style';
--   drop table if exists public.app_settings;   -- only if nothing else uses it
--   (and drop backups.app_settings_20261108 once verified)

begin;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- Everyone reads settings (they shape the public UI); only staff writes.
create policy if not exists app_settings_read on public.app_settings
  for select using (true);

insert into public.app_settings (key, value)
values ('oos_badge_style', '"dim"'::jsonb)
on conflict (key) do nothing;

commit;
