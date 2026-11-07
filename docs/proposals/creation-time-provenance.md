# Creation-time demo / real provenance

User request: new dashboard content created while demo is ON must hide on OFF; content created OFF is real and must survive launch. Hiding is not deletion.

## Code coverage in this patch
- Admin shop/provider inserts snapshot the verified flag once before any async work, and write existing is_demo on every retry. No retry drops the tag.
- Local added shops/providers, custom products and professional services snapshot demo at creation. OFF filters demo content without erasing storage; ON restores it. Real records keep demo=false permanently through toggles.
- Unknown/unverified setting refuses creation with a retry message rather than classifying a row as real.
- Legacy untagged local records stay intact and visible. No bulk reclassification.
- Current UI has no admin create-service-row API; independent professional services here are local dashboard records.
- Existing SQL columns only cover shops/providers/services. This is not a universal database guarantee for jobs, rides, listings, prices, offers or products. New future content types need the same contract before release.
- Seed generator no longer emits DELETE or overwrite-on-conflict SQL. New sample shops/providers/services are marked demo=true. Existing checked-in old SQL/seed files are historical and MUST NOT be rerun for launch cleanup.

## Separate SQL design, not deploy-ready
Before owner approval, inspect live columns, RLS, grants, triggers, constraints and migration history. Do not infer the live DB from source files.
1. Back up full affected tables and schema; record a manifest of row primary keys and existing provenance. Include real/legacy counts and selected checksums. Prove a restoration on an isolated copy.
2. Keep existing shops/providers/services flags. Do not rerun old demo-mode SQL, which marks all existing rows demo. Do not classify old records by name, ID range or date.
3. Add provenance to each future supported persistent content table only after mapping ownership, parent relations and server pricing dependencies. Historical products should be protected/unknown until individually identified, not bulk demo.
4. New server writes should capture app_settings.demo_mode in a server transaction at insertion, with owner-authorized overrides only if deliberately designed. A client payload alone is not tamper-proof or atomic with a concurrent toggle.
5. Prevent ordinary edits from flipping an existing real row to demo. Preserve all real and unknown rows during cleanup. OFF should filter, not delete. Include nested relations and caches in the read contract.
6. Launch cleanup should default to no deletion. Produce a read-only, reviewed manifest of explicitly tagged demo row IDs and dependencies. Any future deletion requires separate owner approval, backups and tested referential behavior.
7. Rollback disables the new trigger/read filtering first and redeploys prior code. Keep provenance columns and all rows for investigation; never drop columns or delete data as an automatic rollback. Restore individual rows from the reviewed manifest only if a separately approved repair requires it.

## Read-only preparation queries for existing supported columns
```sql
select key, value from public.app_settings where key = 'demo_mode';
select is_demo, count(*) from public.shops group by is_demo;
select is_demo, count(*) from public.providers group by is_demo;
select is_demo, count(*) from public.services group by is_demo;
```
Validate app_settings column names against live schema before running even these example queries. No SQL in this proposal was applied.
