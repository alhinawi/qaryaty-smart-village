-- ─── خدمتين جديدتين: «ترزي» (id 44) و«جمعية» (id 45) ───
-- PREPARED 2026-11-09, NOT APPLIED. Run only after the owner says OK.
-- Both rows are demo listings (is_demo = true), so they follow the demo-mode
-- toggle exactly like the rest of the sample catalog: they show while demo
-- mode is ON and disappear when he switches to real mode.
-- «جمعية» is a listing/booking entry only: no payment logic, no commission,
-- no money movement in the app (the description says the money stays outside
-- the app). Money handling needs his explicit separate ask.
-- IDs 44/45 continue the bundled sample-data ids (max in use: 43 اطلب توكتوك).
-- Backup before running: nothing to back up (pure inserts); verify id 44/45
-- are free first with:  select id from public.services where id in (44, 45);
-- Rollback:
--   delete from public.services where id in (44, 45) and is_demo = true;

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
   true),
  (45, 'home', '🤝', 'جمعية',
   'جمعية شهرية بين أهل القرية — سجّل اسمك واختار دورك، والاتفاق والفلوس بينكم برّه التطبيق',
   'شهري', 'من غير رسوم', null, 'quote',
   '4.9', 'new', false, null,
   '[{"id":"share","label":"قيمة السهم الشهري؟","choices":["100 ج","200 ج","500 ج"]},{"id":"turn","label":"عايز دورك إمتى؟","choices":["أول الجمعية","نص الجمعية","آخر الجمعية"]}]'::jsonb,
   false,
   array['جمعية','جمعيه','اشتراك شهري','توفير','ادخار','فلوس','حصالة'],
   true)
on conflict (id) do nothing;

commit;
