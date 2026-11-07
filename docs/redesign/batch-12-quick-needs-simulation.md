# Batch 12: quick needs simulation

Per the owner's latest direction, verified demo ON now simulates «مفتوح دلوقتي» using Cairo local time and plausible synthetic schedules (pharmacies either24h or9am→2am; groceries7am→midnight). An explicit manual-close override wins. Synthetic rider status is available7am→midnight, not a driver/location feed. These presentation-only calculations never change catalog rows, orders, aggregates or DB. OFF/unknown immediately removes simulated claims and restores the honest catalog-discovery caveat. No visible demo label in ON.

Fixed a discovered earlier defect: negative-ID illustrative pharmacies cannot use the positive-ID detail route. They now open their existing product menu directly. Real positive-ID shops retain their detail links. Demo shop modal is closed from rendering when demo turns OFF.

548tests/90files, build/TS pass; full lint0errors5existingwarnings. New tests cover Cairo DST, exact opening boundary, midnight, overnight schedule, manualclose precedence and rider night-hours. Browser320/390 verified simulatedopen/rider, manualclose removes grocery, illustrativepharmacymenu opens, OFF/unknown hides claims, noerrors/overflow. Native3xpharmacy320/delivery390 inspected. Simulated schedules are not real merchant hours and never authorize orders.

## Launch/demo-OFF checklist additions

- Quickneed openhours + riderclaims disappear onOFF and unknown.
- No synthetic driveridentity, phone, coordinates, liveavailability feed or DBwrites.
- Any synthetic status must not affect realorder acceptance or aggregates.
- Previously built demo opinions, liveorderpulse, sampleoffers/orderhistory/event simulation stay verified-toggle gated. Full cross-module creation-provenance audit is the next separate task, not complete in this patch.
- Real records created while demoOFF must survive all toggles/launchcleanups. Do not bulk-delete by age/name/ID guesses.

Menu follow-up: unifiedmenu→sale→swaptab now browserpassed320/390/768; nooverflow. Corrected role locator, no code change required.
