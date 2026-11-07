# Creation provenance code follow-up

Based on consolidated tip 8738363. No DB apply, deletion, branch push or publication.

## Implemented
Admin-created shops/providers write a creation-time is_demo snapshot into the existing column; retries never omit it. Local added shops/providers, custom products and professional services keep demo=true/false from creation. OFF hides demo entries without deleting them; ON restores them. Real entries and older untagged data remain stored. Unknown settings stop new creation with a retry message rather than guessing. A tagged demo product cannot become a real checkout item through a real parent shop.

Seed generation now produces no DELETE and no UPDATE-on-conflict. New sample shops/services/providers are demo=true. Generation was tested only into an isolated temporary directory. Existing historical SQL files must not be rerun on live data. Broader server-side atomic provenance and cleanup design remain separately gated in docs/proposals/creation-time-provenance.md.

## Verified
- TypeScript/build pass; 606 tests in 103 files pass; lint 0 errors / 5 existing warnings.
- Unit checks: ON/OFF payload captured before async client access, compatibility retry keeps flag; unknown mode refuses creation; shop/provider visibility and restoration; local product/service tags; old untagged rows kept.
- Browser 320/390: create one product ON and one OFF, persisted tags verified, demo product hidden OFF and restored ON, real product kept, no page errors/overflow.
- Native 3x screenshots at 390x844 = 1170x2532, ON/OFF actual pixels inspected.
- Generated seed SQL inspected: four conflict-preserving inserts, no DELETE or UPDATE; no SQL executed.

## Limits
Live DB was not inspected or changed. Existing columns are source-grounded, not a claim that every deployed policy/column is verified. Product/pro-service creation here is local device storage, not a new real server product API. Jobs/rides/listings/prices/offers are not covered by a universal new database provenance trigger. Real records are protected from automatic demo cleanup, not from their owner's explicit normal deletion UI. No cleanup command or launch deletion is added.

Code rollback: revert this follow-up only; leave local stored data intact. Missing demo tags after rollback must never be used as grounds to delete anything.
