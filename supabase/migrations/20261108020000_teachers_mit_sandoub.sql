-- ─── المدرسون التجريبيون: ~90% من منية سندوب ───
-- PREPARED 2026-11-08, NOT APPLIED. Run only after the owner says OK.
-- All 56 active teachers are demo rows (is_demo = true); no real provider is
-- touched. Current: 29/56 from منية سندوب (52%). After: 51/56 (91%), keeping
-- ميت خميس (5) as the natural neighboring remainder.
-- Moves: القاهرة(3) الإسكندرية(3) المنصورة(5) بدواي(4) شها(2) تلبانة(1)
--        سلكا(1) منية بدواي(1) and 2 rows with an empty village → منية سندوب.
-- Backup before running:
--   create table if not exists backups.providers_20261108_teachers as
--     select id, name, village from public.providers where kind = 'teacher';
-- Rollback: restore village per id from backups.providers_20261108_teachers, e.g.
--   update public.providers p set village = b.village
--   from backups.providers_20261108_teachers b
--   where p.id = b.id and p.kind = 'teacher' and p.is_demo = true;

begin;

update public.providers
set village = 'منية سندوب'
where kind = 'teacher'
  and is_demo = true
  and active = true
  and coalesce(village, '') <> 'منية سندوب'
  and coalesce(village, '') <> 'ميت خميس';

commit;
