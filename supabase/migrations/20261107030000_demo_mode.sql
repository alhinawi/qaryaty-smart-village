-- ─── Demo-mode switch: hide (never delete) the seeded demo catalog ─────────
-- PREPARED 2026-11-07, NOT APPLIED. Backup first, apply after owner OK.
-- Audit 2026-11-07 (live DB): every shops/providers/services row is seeded
-- demo content — none has an owner_profile_id or came from a real merchant —
-- so marking ALL existing rows is_demo = true is honest. Rows added later
-- (real merchants) default to false = real.

begin;

-- 1) Provenance flag on the three catalog tables
alter table public.shops     add column if not exists is_demo boolean not null default false;
alter table public.providers add column if not exists is_demo boolean not null default false;
alter table public.services  add column if not exists is_demo boolean not null default false;

-- 2) Everything that exists today is the seeded demo catalog
update public.shops     set is_demo = true;
update public.providers set is_demo = true;
update public.services  set is_demo = true;

-- 3) The switch itself: 1 = demo content visible (current behavior), 0 = real mode
insert into public.app_settings (key, value) values ('demo_mode', 1)
on conflict (key) do nothing;

commit;
