# Public reviews - implementation and deployment gate (not applied)

## Existing state checked

- `RatingModal` calls local `useOrderStore.addRating`; it does not publish a review.
- Live Supabase Orders hides that local-only rating/reward control. Keep that guard until backend is ready.
- `orders` has `user_id`, `status`, `shop_id`, `provider_id`, `service_id`, and private delivery/payment fields. None of those private fields should appear in public review responses.
- Catalog stars/counts currently come from catalog records. Do not treat these existing demo values as verified review aggregates.

## Proposed data and write boundary

1. Private `reviews`: UUID id, unique order_id, author_id, target_kind/target_id, integer stars 1..5, plain text up to 1000 characters, submitted_at server timestamp, status pending/published/hidden, moderation audit fields. Author label is a separate user-consented public display name, not a phone/address or automatic full profile name.
2. Authenticated submit RPC reads and locks the order. It derives author and target from the actual order, requires auth.uid() = order.user_id and status = done, rejects demo and self-owned merchant orders, and rejects a duplicate even under concurrent requests. Do not accept caller-supplied verification or target identity. Guest orders need an explicit verified-account claim flow before eligibility, not a phone-number match.
3. One primary target per order: shop when present, otherwise booked provider, otherwise service. A service aggregation may roll up its providers, but must be explicitly documented and never count the same order twice. An order without a resolvable target cannot create a review.
4. Moderation: pending by default, publish through authorized admin role. Merchant cannot edit/remove reviews. Admin actions logged with reason. Do not hide negative ratings merely for low stars. Text safety checks handle personal data, abuse and spam before publication. Old fake/demo rows are never imported as genuine reviews.
5. Reports: separate private review_reports with reporter_id, review_id, enumerated reason, server timestamp, unique reporter/review; authenticated insertion only, no public reporter list, rate limits. Reporting does not auto-remove a review by raw report count. Moderation checks the content.
6. No reward changes in this feature. Any future points award must be server-side, idempotent and separately approved under current product rules.

## Public read contract

Expose a narrow RPC/view for published reviews only: public review ID, consented author label, stars, text, public timestamp and server-derived completed-order badge. No order IDs, account IDs, phones, delivery address, notes, payment data, or report identities. Scope to visible real catalog entries; demo samples require demo mode and an explicit label. Return only safe fields with keyset pagination (20 at a time), stable sort and aggregates over the same published set. Zero reviews returns count 0 and average null, never a seeded average.

## Required tests before launch

- Anonymous/other-account/non-completed/cancelled/demo/self-merchant/duplicate orders cannot submit.
- Concurrent inserts produce one review and no duplicated rewards.
- Submitter cannot forge target, author, verification, timestamp or moderation status.
- Author and merchant cannot publish, hide, change verification or enumerate private records.
- Public responses and error text do not leak private order/profile/report fields.
- Hidden/pending rows excluded from list, count and average; zero and fractional averages correct.
- Auth switch/logout invalidates in-flight private requests; unavailable backend never falls back to fictional public reviews.
- Report authorization, deduplication, rate limits and admin audit tested.

## Rollout

This document and `/preview/reviews` are prototypes only. No table/RPC/policy has been created or changed. Before deployment: inspect live schema and RLS, take and verify a fresh recoverable backup, obtain approval for exact migrations, and test on a separate database. The preview is separate from the connected real-review paths and never substitutes for a failed live read.

## Implemented locally after approval

- Migration `20261107080000_public_reviews.sql`: RPC-only private tables, server-derived eligibility/target, pending moderation, narrow public keyset pages, honest catalog aggregates, private reports and audited content-admin decisions.
- Connected Orders form, catalog list/report UI and admin queue. No rewards change. Unknown/outage aggregates hide stars instead of preserving manually seeded ratings on real rows. Demo catalog stars stay inside demo mode.
- `scripts/review-sql-tests`: run `npm ci && npm test` there. PGlite provides an isolated PostgreSQL-compatible engine; 27 behavioral SQL checks passed. This does not replace live-Supabase schema/role/RLS integration testing.
- Browser lifecycle checked at 390/320 using in-memory repository doubles: completed-order form, name consent, pending submission, admin publication, public list and report, empty hides. No real customer review or report submitted during testing.

## Deployment gate

S3B must inspect the live schema first: `shops.hidden/is_demo/owner_profile_id`, `providers.active/is_demo/service_id/owner_profile_id`, `services.hidden/is_demo`, `orders.shop_id/provider_id/service_id/user_id/status`, `profiles.blocked`, `can_review_content()`. The baseline reviewed here resets customer-created orders to pending and grants status changes only under admin RLS; verify those guards are still live before trusting completed-order badges.

Take a fresh recoverable backup, apply the SQL transaction only after approval, then run authenticated customer/other-account/blocked/guest/content-admin checks against a staging or test account. Do not seed fictional rows into the real reviews table. Public mode has no sample fallback. Test all three target kinds and inspect actual API response fields. Deploy code after SQL; refresh catalog to update aggregates. A missing RPC fails closed rather than inventing ratings.

Rollback disables all reviews RPC access without deleting submitted review/report/audit records. Use `public-reviews-rollback.sql`, then roll back code. Restoring service requires the explicit grants at the end of the reviewed migration, not re-running CREATE TABLE against existing tables.
