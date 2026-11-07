-- PROPOSAL ONLY. Do not apply without owner approval and live schema inspection.
-- Back up definitions and count legacy null coordinates first (read only):
select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.orders'::regclass and conname='orders_location_sane';
select count(*) as legacy_without_location from public.orders where lat is null or lng is null;
-- Store the results privately with the pre-deploy schema backup. No historical row updates/deletes.
-- Future insert/update enforcement only, does not scan or modify historical rows:
-- alter table public.orders add constraint orders_location_required_v2
-- check (lat is not null and lng is not null and lat between -90 and 90 and lng between -180 and 180) not valid;
-- Caveat: NOT VALID still checks future updates to old rows. Review status-update flows
-- before approval; a BEFORE INSERT trigger may be preferable if old coordinate-free
-- orders must keep updating. This is not a deploy-ready migration.
