-- ─── إعادة تسمية الخدمات: «مرسول» (id 3) و«اطلب توكتوك» (id 43) ───
-- PREPARED 2026-11-08, NOT APPLIED. Run only after the owner says OK.
-- The live site reads service name/description from the DB, so these two
-- renames (already in the app bundle) only show live after this runs:
--   * id 3:  «سوبر ماركت» → «مرسول» with its courier-line description
--     (the owner picked «مرسول» for good: «حوّلها لمرسول أفضل»)
--   * id 43: «اطلب التوكتوك» → «اطلب توكتوك»
-- Distance-tier pricing for id 3 is a SEPARATE proposal
-- (20261108031000_marsoul_distance_tiers.sql) awaiting his OK on the amounts.
-- Backup before running:
--   create table if not exists backups.services_20261108_renames as
--     select * from public.services where id in (3, 43);
-- Rollback:
--   update public.services set name = 'سوبر ماركت',
--     description = 'طلباتك من السوبر ماركت على بابك فوراً' where id = 3;
--   update public.services set name = 'اطلب التوكتوك' where id = 43;
--   (and drop backups.services_20261108_renames once verified)

begin;

update public.services
set name = 'مرسول',
    description = 'عايز توصّل حاجة من مكان لمكان؟ المندوب يجيلك لحد باب البيت ويوصّلهالك'
where id = 3 and name = 'سوبر ماركت';

update public.services
set name = 'اطلب توكتوك'
where id = 43 and name = 'اطلب التوكتوك';

commit;
