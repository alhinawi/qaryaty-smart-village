-- Rollback: service id 3 name back to the pre-rename value (recorded 2026-11-09 05:04 EET)
begin;
update public.services set name = 'سوبر ماركت' where id = 3;
commit;
