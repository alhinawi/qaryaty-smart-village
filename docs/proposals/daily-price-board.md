# Daily merchant price announcements

Prepared 7 November 2026. Incremental feature, proposed SQL, not applied.

## Scope
Merchant publishes item, explicit unit, positive EGP price (two decimals). Server binds shop ownership to auth.uid(), checks unblocked account and real/non-hidden shop, and stamps time. Same shop/item/unit is updated in place; at most 40 distinct item/unit pairs per shop. Existing entries remain editable at cap. Withdrawal preserves data and immediately excludes announcement. No ability to forge owner, publication date or source.

Home shows at most 20 announcements from the latest 100 current rows. Editor requests its own shop filter so other shops cannot displace its results. Public projection contains no owner ID or phone. Direct table access is denied, including to authenticated users; only narrow functions can publish/list/withdraw.

Announcement is valid on the Cairo calendar date of its server timestamp, never a rolling 24h. SQL rejects stale/future rows from public reads. Browser re-evaluates its loaded list every 30 seconds and on load; focus refreshes public source rows. No external site is polled. Empty, unavailable, unknown or unconfigured source produces no public panel, not invented prices. Editor read failure is visible and writes never claim success on RPC failure.

This is a merchant ANNOUNCEMENT board, not a catalog-price sync: UI says to confirm price with the shop and explicitly says products/order totals are not automatically changed. Current dashboard catalog overrides are still device-local in the base. No order buttons were added to announcements. Checkout, delivery fees, wallets, balances and existing products are unchanged.

## External sources
No outside API connected, scraped, subscribed to or paid for. See daily-price-api-research.md for checked sources. Global commodity prices, monthly datasets and wholesale ranges must not be presented as actual local selling prices. Optional reference adapter remains unimplemented until access, reuse terms, units, geography and freshness are verified.

## Deployment gate
1. Inspect live public.shops id/name/owner_profile_id/is_demo/hidden and public.profiles id/blocked, auth.uid(), extension support for gen_random_uuid(), roles anon/authenticated, function ownership and current table grants. Verify no conflicting table/function exists. Ensure public schema is not creatable by untrusted roles.
2. Back up affected schema and ownership/privileges. Apply 20261107093000_daily_price_board.sql transaction only under approved DB process.
3. Stage with real Supabase sessions: non-owner/anonymous/blocked/demo/hidden cannot publish; owner can publish and withdraw; anonymous sees only current permitted rows; direct table access denied. Verify two concurrent insert cap requests, owner account revocation, and Cairo midnight boundary. The automated SQL checks are isolated PGlite, not live Supabase integration proof.
4. Publish code only after stage checks. Otherwise public silently hides missing RPC, but merchant form would show errors.
5. No sample rows or external numeric values are seeded.

## QA
524 application tests initially passed; two additional SQL access checks bring harness total to 29. Production build and scoped lint passed. Browser 390/320 CSS px, native 3x screenshots: public rendering, empty hide, merchant publish, withdrawal and rejected write with in-memory repository doubles. Not an authenticated live-backend test. Existing adjacent offers-duration row needed flex wrapping at 320px (same narrow fix as merchant-notes bundle).
