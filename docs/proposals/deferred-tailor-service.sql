-- ─── خدمة جديدة: «ترزي» (id 44) ───
-- PREPARED 2026-11-09, NOT APPLIED. Run only after the owner says OK.
-- The row is a demo listing (is_demo = true), so it follows the demo-mode
-- toggle exactly like the rest of the sample catalog.
-- (The «جمعية» row was split out of this proposal: the owner put the gamiya
-- service on hold for now - pending his decisions on fees and money handling.)
-- ID 44 continues the bundled sample-data ids (max in use: 43 اطلب توكتوك).
-- Backup before running: nothing to back up (pure insert); verify id 44 is
-- free first with:  select id from public.services where id in (44);
-- Rollback:
--   delete from public.services where id in (44) and is_demo = true;

begin;

insert into public.services
  (id, cat, emoji, name, description, time, price, numeric_price, price_type,
   rating, badge, featured, subject, options, hidden, keywords, is_demo)
values
  (44, 'craft', '🧵', 'ترزي',
   'تفصيل وتصليح هدوم على مقاسك — الترزي ياخد مقاسك لحد البيت أو تودّيله الشغل',
   'حسب الشغل', 'السعر بالاتفاق مع الترزي', null, 'quote',
   '4.8', 'new', false, null,
   '[{"id":"work","label":"نوع الشغل؟","choices":["تفصيل جديد","تصليح وتعديل","ستاير ومفروشات"]}]'::jsonb,
   false,
   array['ترزي','خياط','خياطة','تفصيل','تصليح هدوم','سوسته','بنطلون','فستان','مفروشات'],
   true)
on conflict (id) do nothing;

commit;
