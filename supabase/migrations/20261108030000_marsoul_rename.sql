-- ─── خدمة التوصيل (id 3): التسمية النهائية «مرسول» ───
-- PREPARED 2026-11-08, NOT APPLIED. Run only after the owner says OK.
-- The owner renamed the supermarket-delivery service to «مرسول» for good
-- («بص حولها لمرسول أفضل»); this aligns the live catalog row with the app.
-- Distance-tier pricing is a SEPARATE proposal (20261108031000) awaiting his
-- OK on the amounts — not in this file.
-- Backup before running:
--   create table if not exists backups.services_20261108_marsoul as
--     select * from public.services where id = 3;
-- Rollback:
--   update public.services
--   set name = 'سوبر ماركت', description = 'طلباتك من السوبر ماركت على بابك فوراً'
--   where id = 3;
--   (and drop backups.services_20261108_marsoul once verified)

begin;

update public.services
set name = 'مرسول',
    description = 'عايز توصّل حاجة من مكان لمكان؟ المندوب يجيلك لحد باب البيت ويوصّلهالك'
where id = 3 and name = 'سوبر ماركت';

commit;
