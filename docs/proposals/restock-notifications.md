# Availability notifications: preview and server proposal

Status: LOCAL PREVIEW ONLY. Nothing applied remotely, no production notification delivery.

## Implemented preview
- Photographed sold-out custom products remain in mock catalog; unphotographed customs stay hidden.
- Menu and global product search preserve sold-out products with «خلصان». Menu add is disabled; old cart checkout rejects current demo unavailability.
- Verified demo only: session-storage one-shot subscriptions and notices, scoped to current account. A merchant's explicit availability OFF→ON handler emits once. Price/quantity edits do not emit.
- Notification drawer supports read/read all. Gate OFF and different account hide the prior account's notices.
- Merchant overrides remain existing device-local state. This is a same-account/device preview, NOT cross-account or server restock delivery.
- Product search's inherited static-index limitation remains: new custom products are not indexed. Existing indexed products reflect demo availability.

## Required server work, not implemented
1. Validate current deployed schema, policies, functions and merchant ownership against live backup. Do not assume checked-in SQL equals deployed schema.
2. Add owner-only availability RPC and write path. Base catalog availability is per shop via overrides; custom products retain photo requirement. Do not fire from a stock quantity write, initial insertion, catalog refresh, or staff edits.
3. Subscribe authenticated customers only after authoritative product lookup verifies manual availability=false. Never trust client product/shop names or arbitrary URLs.
4. In the same merchant OFF→ON transaction, lock and consume active subscriptions, insert one private in-app notice each. A retry must not duplicate notices. Re-arm only from an explicit new customer subscription.
5. Wire live catalog override/custom reads, sold-out visibility and server checkout validation together. Current live catalog and dashboard write gaps mean applying tables alone is not a feature release.
6. Adapt notification repository to server notices. RLS: only the target profile may read/mark their notices; merchant cannot inspect subscribers. Restrict creation to owner-validated server procedure.
7. Limit spam/repeated arming; product deletion/cross-shop checks; concurrency and retry tests; cancellation; account switching; empty/error/loading states.

## Review gates
Proposed staging schema is in restock-notifications.sql, deliberately outside migrations. It is not a deploy-ready implementation. No trigger or application integration is claimed. Final SQL requires approval after deployed policies and notifications schema are checked.

Backup before approved changes: schema-only dump including functions, policies, grants and triggers; data dump of shops, catalog_products, shop_product_overrides, shop_custom_products, profiles and existing notification tables. Verify restore in isolated database. Record counts and active availability states. Existing public visibility policies must be saved verbatim before replacement; do not widen no-photo custom-product access.

Rollback: disable new UI/write paths first, drain or preserve pending subscriptions/notices, export new tables, then remove only this feature's objects in a transaction. Restore exact backed-up visibility policies and prior notification adapter. Do not delete existing customer notifications. Test rollback and restore on the isolated copy before release.

## Actual checks
543 unit tests pass; production build passes. Native3x mobile390/320 browser: sold-out milk remains visible, subscribe/cancel button changes, price edit creates no notice, actual merchant availability switch creates «رجع متاح»; no JS errors. Unit tests cover gate OFF, exact transition/idempotency, account/product isolation, cancellation/re-arm and read scope. No live Supabase integration, concurrency or cross-account delivery test has been performed.
