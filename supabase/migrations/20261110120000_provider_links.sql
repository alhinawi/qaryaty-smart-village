-- ─── Provider card links + the developer's teacher details ──────────────────
-- APPLIED to the live DB on owner request (5 years of experience, IELTS
-- certificate, sample lessons). Safe to run again.
--
-- links: optional jsonb list of {label, url, kind?} shown on a provider's card
-- (kind: 'certificate' | 'samples'). Empty/null shows nothing; the app only
-- renders https links. Admin saves never send this column, so they keep it.

begin;

alter table public.providers add column if not exists links jsonb;

-- Mohamed Alhinawi's own teacher cards (143 programming, 144 English) are a
-- real person, not seeded demo content: keep them visible if demo mode is off.
update public.providers
set experience_years = 5,
    is_demo = false,
    links = '[{"label":"عينة من شروحاتي","url":"https://drive.google.com/drive/folders/1-0y6uXa07T7bbKinrWscVrh7vZl-A8Ol","kind":"samples"}]'::jsonb
where id = 143;

update public.providers
set experience_years = 5,
    is_demo = false,
    links = '[{"label":"حاصل على شهادة IELTS","url":"https://drive.google.com/file/d/10JKnLOyvdNTyD73aErrxVthWoy1kohNT/view?usp=drivesdk","kind":"certificate"},{"label":"عينة من شروحاتي","url":"https://drive.google.com/drive/folders/1-0y6uXa07T7bbKinrWscVrh7vZl-A8Ol","kind":"samples"}]'::jsonb
where id = 144;

commit;
