# Batch 6: lifecycle and lint

- AccountPicker clears its search in the opening click rather than synchronously in an effect. Focus still waits 60ms.
- Profile referral state is tied to the account ID. Signing out or switching accounts immediately stops displaying the previous account's result; old async responses remain cancelled by the existing effect cleanup.
- NotificationsDrawer uses an explicit account ID dependency without capturing a whole user object.
- Dashboard busy duration highlight reads a stateful clock updated every 30 seconds, not Date.now during render. Selection and expiry rules are unchanged.

Validation: full ESLint exits 0 with no errors and 5 existing Fast Refresh warnings. All 540 tests in 88 files pass. Production build passes. No CSS or layout change in this batch. No DB, server, auth-flow, payment or reward rule changes. These checks do not claim live-account testing.
