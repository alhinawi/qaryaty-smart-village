# Last-address deletion guard - proposed SQL

One remaining address: delete disabled with persistent explanation to add another first. Guard also lives in store (fresh repository read) and local repository. With another address: existing confirmation remains, deletion promotes the newest remaining address.

Live adapter now calls delete_saved_address, not direct delete. Proposed migration must land BEFORE code, after backup. RPC derives auth.uid(), rejects blocked accounts/other owners, locks profile to serialize separate-device deletions, refuses count<=1, deletes only selected owner row and ensures one remaining default. Existing after-delete trigger is preserved. Direct authenticated DELETE grant is revoked to stop old clients bypassing guard. Account deletion cascade is unaffected by a user-facing DELETE grant. No records are removed by this migration itself.

Deployment gates: inspect live profiles/user_addresses columns, existing after-delete and before-write triggers, grants (including any broader PUBLIC grant), RLS, function owners, auth.uid and profile locking behavior. Ensure no other legitimate direct-delete caller needs migration. Back up old grants/RPC. Stage real auth tests including two concurrent deletes, blocked user, another user's ID, last row, default promotion. PGlite harness six isolated tests is not a live Supabase concurrency/RLS proof.

Rollback: revert adapter/UI before restoring captured prior DELETE privileges. Leave existing saved addresses untouched; no destructive rollback.

Profile decorative navigation/CTA emojis replaced with Lucide SVGs (about, groups, share/copy, photo actions, account heading). Names/avatar fallbacks, data labels and status text preserved. No rewards/payment logic changes.
