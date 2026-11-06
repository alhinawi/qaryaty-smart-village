-- ─── Every village in Egypt, searchable, for the "القرية" field ────────────────────────────
-- Run after supabase/schema.sql. Safe to run again. The rows themselves are in
-- 20261106160100_villages_data.sql (built by scripts/villages/build_villages.py).
--   • villages: name, markaz, governorate (Arabic), a point when we know it, and `served`
--     (we deliver there). Everyone can read it; only admins (or the service role) write.
--   • search_villages(q): what the picker calls. Tolerant to أ/إ/آ/ا, ة/ه, ى/ي and
--     harakat; matches the start of the name or of any word in it, then close spellings.
--   • profiles.village_id: filled by a trigger when profiles.village is a label from the
--     list ("منية سندوب، مركز المنصورة - الدقهلية"). A typed name that is not in the list
--     ("قريتي مش موجودة") and older free-text values stay as they are, with village_id null.

create extension if not exists pg_trgm with schema extensions;

-- Arabic search key: no harakat/tatweel, one alef, ة→ه, ى→ي, ؤ→و, ئ→ي, single spaces.
create or replace function public.ar_normalize(input text) returns text
language sql immutable parallel safe as $$
  select btrim(regexp_replace(
    translate(
      regexp_replace(coalesce(input, ''), '[\u064B-\u0652\u0670\u0640\u200E\u200F]', '', 'g'),
      'أإآٱةىؤئ،,-',
      'ااااهيوي   '
    ),
    '\s+', ' ', 'g'))
$$;

create table if not exists public.villages (
  id           integer primary key,
  name         text not null,
  markaz       text not null default '',
  governorate  text not null,
  lat          double precision,
  lng          double precision,
  kind         text not null default 'village' check (kind in ('village', 'hamlet', 'city')),
  served       boolean not null default false,
  search_key   text generated always as (public.ar_normalize(name)) stored,
  label        text generated always as (
                 name || case when markaz <> '' then '، ' || markaz else '' end || ' - ' || governorate
               ) stored,
  constraint villages_sane check (length(name) between 1 and 80 and length(markaz) <= 80 and length(governorate) <= 40)
);

create index if not exists villages_search_trgm on public.villages using gin (search_key extensions.gin_trgm_ops);
create index if not exists villages_search_prefix on public.villages (search_key text_pattern_ops);
create index if not exists villages_label on public.villages (label);
create index if not exists villages_served on public.villages (id) where served;

alter table public.villages enable row level security;
drop policy if exists "villages: anyone reads" on public.villages;
create policy "villages: anyone reads" on public.villages for select using (true);
drop policy if exists "villages: admins write" on public.villages;
create policy "villages: admins write" on public.villages for all
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.villages from anon, authenticated;
grant select on public.villages to anon, authenticated;
grant insert, update, delete on public.villages to authenticated; -- still needs is_admin() by RLS

-- The picker: up to `lim` villages for what the person typed (2 letters or more).
create or replace function public.search_villages(q text, lim integer default 20)
returns table (id integer, name text, markaz text, governorate text, served boolean, kind text, label text)
language sql stable security invoker
set search_path = public, extensions
as $$
  with k as (select public.ar_normalize(q) as k)
  select v.id, v.name, v.markaz, v.governorate, v.served, v.kind, v.label
  from public.villages v, k
  where length(k.k) >= 2
    and (
      v.search_key like k.k || '%'
      or v.search_key like '% ' || k.k || '%'
      or (length(k.k) >= 4 and v.search_key % k.k)
    )
  order by
    (v.search_key = k.k) desc,
    (v.search_key like k.k || '%') desc,
    v.served desc,
    (v.search_key like '% ' || k.k || '%') desc,
    similarity(v.search_key, k.k) desc,
    (v.kind = 'city') desc,
    length(v.name),
    v.governorate, v.markaz, v.id
  limit least(greatest(coalesce(lim, 20), 1), 50)
$$;
grant execute on function public.search_villages(text, integer) to anon, authenticated;
grant execute on function public.ar_normalize(text) to anon, authenticated;

-- profiles.village_id, kept in step with the village label
alter table public.profiles add column if not exists village_id integer references public.villages (id) on delete set null;
create index if not exists profiles_village_id on public.profiles (village_id);

create or replace function public.profiles_set_village_id() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.village is distinct from old.village then
    new.village_id := (
      select v.id from public.villages v
      where v.label = btrim(coalesce(new.village, ''))
      order by v.served desc, v.id limit 1
    );
  end if;
  return new;
end $$;

drop trigger if exists profiles_village_id on public.profiles;
create trigger profiles_village_id before insert or update of village on public.profiles
  for each row execute function public.profiles_set_village_id();
