-- ─── مساعد قريتي: جدول عدّاد الكوتا اليومية (assistant_usage) ───
-- PREPARED 2026-11-08, NOT APPLIED. Run only after the owner says OK.
-- Why: the assistant-reply edge function caps live AI answers at 20 per user
-- per day; over the cap the app shows the canned replies. The function works
-- WITHOUT this table (answers without counting) so deploying is never blocked;
-- the table is what enforces the cap once applied.
-- Shape: one row per user per day; user_key is the auth user id when signed
-- in, otherwise the caller IP as seen by the function. No message content is
-- ever stored here — counters only.
-- Backup before running:
--   create table if not exists backups.assistant_usage_20261108 as
--     select * from public.assistant_usage;   -- empty if the table is new
-- Rollback:
--   drop table if exists public.assistant_usage;
--   (the function keeps working, just without the cap)
--   (and drop backups.assistant_usage_20261108 once verified)

begin;

create table if not exists public.assistant_usage (
  user_key text not null,
  day date not null,
  count integer not null default 0,
  primary key (user_key, day)
);

alter table public.assistant_usage enable row level security;
-- No client policies on purpose: only the edge function (service role)
-- reads/writes counters. Users never query this table directly.

commit;
