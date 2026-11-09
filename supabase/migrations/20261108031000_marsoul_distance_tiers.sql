-- ─── خدمة مرسول (id 3): تسعير حسب المسافة (شرائح) ───
-- PREPARED 2026-11-08, NOT APPLIED. Run only after the owner says OK on the
-- AMOUNTS — he saw the 10/20/35 ج proposal in the app preview and has not
-- approved the numbers yet. Apply AFTER 20261108030000_marsoul_rename.sql.
--   جوّه القرية 10 ج (same as today) · لقرية جنبنا 20 ج · للمدينة 35 ج
-- The card shows «من 10 جنيه» and the order form asks «التوصيل فين؟».
-- Backup before running:
--   create table if not exists backups.services_20261108_tiers as
--     select * from public.services where id = 3;
-- Rollback:
--   update public.services
--   set price = '10 جنيه', numeric_price = 10, price_type = 'fixed', options = null
--   where id = 3;
--   (and drop backups.services_20261108_tiers once verified)

begin;

update public.services
set price = 'من 10 جنيه',
    numeric_price = 10,
    price_type = 'from',
    options = jsonb_build_array(
      jsonb_build_object(
        'id', 'zone',
        'label', 'التوصيل فين؟',
        'choices', jsonb_build_array('جوّه القرية', 'لقرية جنبنا', 'للمدينة'),
        'prices', jsonb_build_object(
          'جوّه القرية', jsonb_build_object('price', 10, 'priceType', 'fixed', 'label', 'توصيل جوّه القرية · 10 ج'),
          'لقرية جنبنا', jsonb_build_object('price', 20, 'priceType', 'fixed', 'label', 'توصيل لقرية جنبنا · 20 ج'),
          'للمدينة', jsonb_build_object('price', 35, 'priceType', 'fixed', 'label', 'توصيل للمدينة · 35 ج')
        )
      )
    )
where id = 3 and name = 'مرسول';

commit;
