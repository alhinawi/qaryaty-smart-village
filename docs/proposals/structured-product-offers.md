# Product percentage offers: proposed rollout

One product per shop, integer1..99%, starts immediately, duration2/3/4/6hours. No fixed price, future scheduling or minimum rules yet. New offer replaces previous atomically; exact-ID stop cannot stop a newer replacement accidentally. Merchant editor keeps base catalog prices. Menu shows original/current unit price and end time. Cart checks shop-specific offer again before submit; changed price/offer updates cart and requires another confirmation. Server rejects missing/stale unit price or offer ID and stores original/current unit price, offer ID and percent in order item JSON. Product discount excludes grilling and delivery. Existing commission function, rate, caps and QARYA1 rules remain unchanged; normal commission calculation uses the discounted item subtotal.

## Rollout: do not deploy frontend alone
- Proposed SQL only: supabase/migrations/20261107110000_product_offers.sql. Nothing applied remotely.
- Back up actual live orders_before_insert, daily_offers definitions/policies and data. Reconcile this function replacement against newer live changes, especially stock work.
- Depends on daily_offers and delivery_fee migrations. Transactional SQL retires existing text-only ads without deleting rows, adds structured fields, locks publisher/order discount reads using advisory locks, restricts writes to owner-only RPC.
- Coordinate SQL+client deployment. Old clients lacking expected prices will be rejected, not charged a surprise amount. Refresh clients after rollout.
- Rollback proposed at supabase/rollback/20261107110000_product_offers.sql. Restore backed-up live function instead if it differs from the source baseline. Keep snapshot columns/history. Rollback stops structured offers; no ad or order deletion.

## Demo safety
Verified demo shop menu uses account-scoped local offer storage and demoOnly cart lines. Checkout routes only to mock repository, cash only, never payment/order integration; it does not consume real first-order promo or add reward points. Mock order recalculates/snapshots numeric prices and rejects stale terms, gets ord_demo_local_ prefix, hides when demo off, preserves through history refresh, clears with account scope. General live orders never fall back to this path. Fake fulfillment stock hook for these newly created ord_demo_local orders must be merged with the separate stock patch; existing sample-history automatic deduction is a separate component. No remote stock changes.

## Verification
533unit tests, build, touched-file lint. Native3x390+320 browser: form20%, milk45->36, menu original/current, cart36+2normal commission+10demo delivery=48, actual local checkout receipt48 with item unit36, no page errors. Browser used local QA fixture account/shop, no external sends or real order. SQL parsed/executed in isolated PostgreSQL-compatible fixture engine: expired legacy migration, owner/product/percent rejection,2x36+5fixture fee+15fixture delivery=92, server snapshots, stale/stop rejection, anonymous order, direct-write permissions and rollback. Fee fixture differs intentionally from production configuration. This does not verify live Supabase, concurrent sessions, real payment or live RLS schema.

### Search integration follow-up
Global product search now applies the same percentage calculator, current/original price and30second refresh; offers read all pages of1000rows instead of silently limiting pricing to homepage20. Homepage still displays first20. Browser390/320 after actual local receipt: search milk shows36 and before45. Existing search base index still comes from static catalog mappings, not a complete dynamic server index; changed base prices/new custom products can still be stale or absent in search. Server checkout remains authoritative and rejects mismatch. A complete live search index is separate work, not claimed solved here.

### Automatic stock follow-up
Imports same demoStock state/model as92ce802 unchanged. New local cart orders now progress pending->confirmed->onway->done with verified demo only. The final transition atomically deducts all product quantities once, scoped by account/cart-orderID. Insufficient inventory blocks final transition; cancellation before done is terminal and consumes nothing. Same session reload remains idempotent. Browser390/320: milk stock3->2 after quantity1 delivery, reload stays2. No live stock changes. When merging92ce802, retain identical demoStock files and its merchant quantity UI/sample-history component.

### Visible old/new price request
Shared OfferPrice shows green new price, old price struck through adjacent and compact -20%badge. Applies search/menu/cart/checkout line. Cart separates quantity controls onto next row on narrow screens so product/name/prices remain readable. Search title wraps instead of losing product identity. Browser390/320 old45/new36/badge20%with complete local checkout unchanged48. Native3x screenshots both widths. No deployment.
