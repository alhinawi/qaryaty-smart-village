# Admin appearance switch - proposed, not applied

Reuse app_settings public read + existing admin-write RLS. New key appearance_enabled (1/0); proposed SQL only inserts default1, preserves existing setting and changes no grants/policies.

Owner-only control next to demo toggle, matching its existing UI authority. Database retains the existing is_admin() authority for settings, not a new client-only rule. Before applying, inspect live app_settings columns/check constraints, RLS/grants, is_admin definition (including blocked accounts) and row value. Back up the old row/state. Stage anonymous/normal/blocked user writes denied and expected admin writes allowed. No live DB checks performed in this bundle.

OFF/unknown: force fixed default light/classic palette1, not system-dark or saved custom theme. Hide appearance link, direct appearance route redirects to settings. Existing saved choices are not deleted and return on ON. Gate never persists as client authority. Unknown/missing/error defaults to OFF. Failed write never claims a state change. Same propagation as demo switch: focus/visibility and60-second app-settings refresh. No extra poll timer. This is UX permission, not a secret or data access boundary.

Rollback: revert UI then restore the captured prior row value, or set appearance_enabled=1 to re-enable. No need to delete prefs/data.

QA: build, app tests, scoped lint; browser390/320 real UI with local backend double: saved dark4 ->OFF light1, hidden entry/direct-route redirect, ON restores dark4, read failure fails closed, rejected write leaves last verified state. Not a live Supabase/RLS integration test.
