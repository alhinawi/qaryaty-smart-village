# حجز المناسبات: preview / schema proposal

User request relayed by main 2026-11-07 10:44: one combined event request, guest count, local providers, approximate provider-listed prices. No payment/commission changes. Preview only, no deployment or database execution.

## Working preview

`/events-preview` is an unlisted prototype route. Type, guest count, Cairo date/time, venue, service categories, note, review. A session-only draft survives reload, not a booking, sent request, availability check or account-persistent promise. No network write and no call to ordinary checkout/payment/commission code. Date is a valid calendar date; operational backend must reject past Cairo timestamps. The number range is a draft validation bound (1-2000), not provider capacity.

Current providers have ordinary service prices, not explicit event packages/menus, chair counts or capacity. The prototype therefore shows unknown prices rather than fabricated numbers or a zero total. It does not remap food catalog items into per-guest menus. No provider list, availability or delivered-event history is invented. The estimate function accepts only fresh owner-confirmed event/guest listing rows, rejects samples in real mode and rejects multiple candidates rather than choosing a provider silently. Chair-unit estimates require a separate explicit chair quantity; guest count is not a chair count, so chair rows remain unknown.

## Proposed data model (not migration SQL)

- `event_service_listings`: UUID, provider_profile_id FK profiles, village_id matching the user's supported locality, service_kind enum, label, unit (event/guest/chair), amount_egp decimal>0, minimum_quantity, maximum_quantity, included_services, excluded_costs, valid_until, updated_at, active, demo flag. Creator can edit only own listing, must be unblocked/approved real provider. No consumer write. Ownership of an existing demo/static Provider number is not account authorization.
- `event_requests`: UUID, customer_profile_id FK profiles, village_id, type enum, guests integer, starts_at timestamptz normalized from Africa/Cairo, venue_snapshot, note, status (draft/requested/partially_quoted/ready/customer_confirmed/cancelled), idempotency_key, created_at. Exactly one parent request and one customer entry point.
- `event_request_lines`: UUID, request_id FK, service_kind, selected_listing_id nullable FK, assigned_provider_profile_id nullable FK, quantity and unit, price_snapshot and quoted_at, availability_confirmed_at, provider_status (awaiting/quoted/declined/expired/accepted), customer_accepted_at. Price/availability must be provider-confirmed, never inferred from a listing. Snapshot retains shown inclusions and expiry.
- `event_request_events`: append-only audit, parent/line IDs, actor_profile_id, old/new status, recorded_at. No money or payment record tables.

RLS: customer sees own parent/lines. Provider sees only its own assigned line and minimum event details needed for that line (type, date/time, guest count, locality and relevant instructions). No customer's phone, exact home address or other providers' quote details in public reads. Full address/contact release needs an explicit workflow/authority decision before execution. Admin access follows verified existing account roles. Disallow client-written accepted prices, assignments and confirmation flags. Server functions lock parent/lines and re-check actor/role/current price/expiry/state. Idempotency prevents a repeated click or retry from sending duplicate requests. Revocation/decline invalidates confirmation. No one becomes booked merely by drafting or requesting.

## Future flow and gates

1. Real approved provider onboards a listing and sets own package price/unit/inclusions/expiry/capacity. No sample fallback.
2. Customer selects providers explicitly, sees partial quote as incomplete, accepts a whole combined plan only when every required line is priced and available. No silent provider substitution.
3. One explicit request action sends one parent with scoped lines; each provider confirms availability and quote. Customer reviews changed quotes before accepting. Ordinary order commission cannot leak into this workflow.
4. Cancellation deadlines, lead times, partial availability, contact-sharing, notification channels and whether an acceptance is a binding commitment still require product decisions. Do not enable live submit until those decisions and owner authority are settled. No booking/no-show fees are authorized by this preview.
5. S3B would verify live schema/roles, backup and rollback plan before any approved migration; test multi-device request/quote/cancel races and provider/customer isolation. No runnable migration supplied intentionally while account linkage and workflow rules remain unresolved.

## QA

517 app tests including 6 new estimate/validation tests. Build and scoped lint pass. Chromium390/320, native3x capture, no JS errors or horizontal overflow, three steps/session save/reload tested. Screens are component captures with fixed bottom navigation hidden for export only, not a changed app UI. Current preview shows unknown-pricing state, not a populated-provider state. No request sent or order created.

## User-requested simulation revision (2026-11-07 11:06)

Supersedes unknown-only prototype in demo mode. Fictional event packages are authored fixtures, not verified market quotes or actual businesses.145EGP/guest catering,25EGP/guest seating,3500tent,2200photo and650transport. Full selection/total/per-guest average/confirmed reference appears in separate event section of Orders. No ordinary Order record, no DB write, no contact call or payment. Single internal source qaryati_event_simulation_v1. Verified tracking demo gate required both UI/store; off/unknown hides event flow/history immediately. Session-only Zustand persistence, scoped to signed-in user ID or guest, no cross-account display. Capacity1-150 for these packages. Duplicate confirmation returns same reference for same draft.520 tests/build/scoped events lint,390/320 full flow/no errors/no overflow; demo OFF and account change verified hide history. Earlier screenshots/docs unknown quote state retained only as design history. Real backend remains unimplemented and not automatically replaced by fictional prices.
