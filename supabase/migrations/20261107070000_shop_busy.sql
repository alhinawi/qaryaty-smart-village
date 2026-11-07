-- ─── حالة «مشغول» للمحل (#23): one-tap merchant busy flag ─────────────────
-- PREPARED 2026-11-07, NOT APPLIED. Backup first, apply after owner OK.
-- busy = orders stay open, prep takes longer (a third state next to
-- مفتوح/مغلق — it never blocks orders). The existing "shops: owner edits own"
-- UPDATE policy already lets the merchant set it on his own shop.

begin;

alter table public.shops add column if not exists is_busy boolean not null default false;
-- Auto-expire: NULL = busy until the merchant clears it himself
alter table public.shops add column if not exists busy_until timestamptz;

commit;
