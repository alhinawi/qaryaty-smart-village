# Backup before the tuktuk service change

Captured from the live Supabase project (delhegkseaytbzejpxrs) on 2026-11-06 ~21:00 EET via the REST API (read-only anon key),
before `supabase/tuktuk-service.sql` was applied.

- `services.json` / `providers.json`: raw rows as returned by the API.
- `services-restore.sql` / `providers-restore.sql`: idempotent restore statements (upsert every captured row).
- To remove the tuktuk change instead: `delete from public.providers where id between 148 and 161; delete from public.services where id = 43;`

- services: 42 rows, max id 42
- providers: 144 rows, max id 144
