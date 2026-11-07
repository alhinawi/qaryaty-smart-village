# Comprehensive UI/UX redesign

Local branch: feature/comprehensive-ui-ux-redesign, baseline033a50d. No push, merge or production release without explicit approval. Offers, stock, restock, no-flash and terms/404 previews remain independent.

## Evidence and boundaries
Initial live audit: 15 public routes,21 route/size checks, dashboard fixture at320/390, keyboard failure reproduced, three cold mobile performance samples. Source examined: route table/App lazy boundaries; Home service/shop/provider composition and filtering; shared cards/actions; Header/BottomNav/PageWrapper; dashboard tabs/products/offers/WhatsApp; stores and repository routing; forms/tokens/styles; Arabic normalization and search components; Vite/PWA caches. Existing API, auth and financial rules remain unchanged. No dependency or schema changes.

The audit is not complete coverage. Expand to320,360,390,430,768,1024,1440,1920. Record real passes/failures and before/after, not merely screenshots of opened pages. Existing audit evidence is retained separately.

## Phases
P0: independent semantic card actions (confirmed favorite keyboard bug); preserve click/add/details/share behaviors. Existing offer checkout consistency is a separate preview, not claimed fixed in this branch. Real-mode sample/trust cleanup needs careful separation of sample provenance from real data.
P1: dashboard narrow layout, shared form labels/error semantics/focus, hero request prioritization and image dimensions; keyboard +8size tests. Measure against baseline with identical cold-load settings.
P2: clearer primary routes/navigation/IA without deleting sections; unified search filters/recent/empty/loading/error UX; tokens/button/input/card/badge consistency, true trust wording, checkout constraint visibility. Preserve all rules and existing data.
P3: restrained polish and secondary states after P0/P1, no cosmetic changes at expense of journeys.

## QA matrix
- Build includes TypeScript. Full ESLint and unit suite; distinguish pre-existing failures.
- Browser journeys: first visit, product search, shop/menu, cart/checkout in isolated demo, teacher, tradesperson, jobs, login validation, prior-order tracking. No real order/payment/message effects.
- Network/catalog/auth failures, invalid forms and protected routes. Only claim the cases actually run.
- Automated a11y plus direct Tab/Enter/Space checks and screenshot inspection. No claim of certified WCAG compliance or physical screen-reader/device testing.
- A-G final File: audit, implementation files, before/after, tests, remaining issues, explicitly subjective scores, Git report.
