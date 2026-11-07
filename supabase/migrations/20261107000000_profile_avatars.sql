-- ─── Customer profile photos ────────────────────────────────────────────────
-- PREPARED 2026-11-07, NOT APPLIED. Backup first, apply after owner OK.
-- The customer picks a photo on the profile page; it is downscaled on the
-- device, uploaded to a public "avatars" bucket under <user id>/avatar.jpg,
-- and its URL saved on the profiles row. Guests keep a local data URL only.

begin;

-- 1) One new column, nullable; existing rows simply have no photo
alter table public.profiles add column if not exists avatar_url text;

-- 2) The account owner may change only this column on their own row (the
--    existing row policy "users update own profile" already limits the row)
grant update (avatar_url) on public.profiles to authenticated;

-- 3) One public bucket, 2 MB max, jpeg/png/webp only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 4) Anyone reads (photos show next to names); only the owner writes own folder
create policy "avatars: anyone reads" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars: user writes own folder" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "avatars: user updates own folder" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "avatars: user deletes own folder" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "avatars: staff manage" on storage.objects for all
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());

commit;
