# Batch 8: keyboard containment and semantics

- Shared Modal traps Tab/Shift+Tab, sends accidental programmatic outside focus back inside, and restores focus to its opener on close. Only the last visible modal handles these keys; Escape does not close underlying modals. Disabled/hidden/inert controls are excluded from tab stops.
- Gallery rail is keyboard-focusable with an explicit Arabic accessible name. Existing dots remain available.
- ProviderCard has a heading-level prop; detail pages use h2 after their h1 while home sections retain h3 under h2.
- Header and people-tile accessible names now use their visible text. Count badges are decorative because the containing action already announces the count.

Checks: 544 tests in 89 files, TypeScript and build pass. Full lint exits 0 with 5 existing Fast Refresh warnings. Local mobile 320/390 browser tested Enter-open, repeated Tab/Shift+Tab, both boundary wraps, programmatic outside focus, Escape-close and exact opener restoration. No JS errors. Desktop keyboard flow and an actual nested React modal have not yet been exercised. No claim of complete WCAG compliance.

Axe baseline sampled home/login/register/shop/service/provider detail at 390px: the heading skips and gallery scroll-focus issue are gone. One label-content-name mismatch on notification counts remains on pages with the shared header; this automated warning still needs investigation. Login/register have no violations in this sampled run. These six routes are not an all-route accessibility audit.
