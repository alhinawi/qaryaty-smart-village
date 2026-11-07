# Batch 9: navigation and failure recovery

- Added a first-focusable skip link to the focusable main landmark. Desktop header tabs now expose aria-current.
- Jobs UI distinguishes a rejected listPublic promise from a successful empty result. Retry keeps search and filters, shows loading, and re-runs the request with existing unmount cancellation. This is a UI-only change, not a repository/API change.
- Caveat: the existing resilient live jobs repository converts some network/Supabase failures to empty arrays. Those swallowed failures cannot be distinguished by this component; the global service-status banner remains the existing signal. No end-to-end outage fix is claimed.

## Route-layout matrix

31 routes x 8 widths = 248 guest route/layout probes, no document horizontal overflow or JS pageerrors, and every landed page had nonempty main content. Some routes redirect to login/home or public list by role. This verifies the guest redirect/render, NOT successful private page use. Direct-load probes were used through early widths; remaining probes used in-app history navigation to avoid repeating the splash delay. Results: qaryati-redesign-route-matrix.json. Fixed viewport height 844, native 3x scale. Main visible content was sampled after 350ms on in-app navigations, so slow/backend states are not proven by this matrix.

## Interactions

320/390/1440: first Tab reaches skip link; Enter focuses main; injected repository promise rejection displays error (not zero jobs); restoring the repository and pressing Retry removes error; query is retained; no JS errors/overflow. Controlled failure is not an actual Supabase outage. Screenshot of narrow error view inspected, plus profile390 and rides1440 matrix views. No order/payment/account mutation was sent to a live service.

544 tests in 89 files pass, TypeScript/build pass. Full ESLint has 0 errors/5 inherited Fast Refresh warnings. Full ten-journey QA, all-page visual inspection, server failure paths and WCAG verification remain open.
