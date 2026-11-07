# Map picker keyboard boundary

Base c525641. LocationPicker is a portal above the cart, not the shared Modal. The prior shared-modal fix did not trap Tab in this separate layer. Added focus boundary switching between permission explanation, map and place search. Focus returns to prior control when possible, otherwise to the still-visible parent dialog. Initial invalid legacy coordinates no longer count as a valid initial point.

Actual browser checks at 320,390,1440: permission prompt Tab/Shift+Tab contained; map 30 Tab steps contained; place-search Tab/Shift+Tab contained; Escape closes search only; map close returns focus into cart. Missing and legacy coordinates still produce zero order writes. Valid saved coordinates still reach controlled failing backend, preserving cart. No page errors or overflow. A screenshot capture at desktop 3x hit a browser capture error; desktop automation reran at 1x. User-facing screenshot is mobile native 3x 1170x2532 and visually inspected. No claim of testing all nested dialogs.

TypeScript/build pass, 606 unit tests / 103 files pass, lint 0 errors / 5 existing warnings. No live order, DB, payment or auth mutation. Rollback: revert this code-only commit; keep saved addresses and orders untouched.
