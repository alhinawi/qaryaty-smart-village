-- Rollback for 20261110120000_provider_links.sql: back to the cards as they were
-- (no experience shown, no links, flagged with the demo catalog). Drops the column.
begin;
update public.providers set experience_years = 0, is_demo = true where id in (143, 144);
alter table public.providers drop column if exists links;
commit;
