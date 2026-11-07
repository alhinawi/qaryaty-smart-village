# Public reviews - proposed backend, not applied

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

This document and `/preview/reviews` are prototypes only. No table/RPC/policy has been created or changed. Before backend implementation: inspect live schema and RLS, take and verify a fresh recoverable backup, obtain approval for exact migrations, test on a separate database, then wire catalog detail sections and Orders eligibility. Until then the sample review page must not become a public real-review feature.
