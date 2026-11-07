# Weekly merchant summary preview

No scheduled backend job, notification, WhatsApp, payment or database change is enabled. Dashboard inserts an honest unavailable-state card, not a partial customer-history total. Existing Dashboard remains owner/admin preview, not merchant-account authorization.

`weeklySummary` takes a complete shop feed, normalized completion timestamps and published order-linked reviews. It derives the latest complete Friday-through-Thursday period using Cairo calendar dates. On Friday delivery uses the immediately completed week. Cancellation/open/sample/other-shop orders excluded in real mode; deduplicates orders/reviews. Ties remain ties, no ratings means unknown not zero, no previous orders means no percentage. Aggregation can accept demo rows only with verified demoEnabled=true. UI currently passes complete=false, no synthetic fixtures: real mode cannot silently show samples. Date ranges use ISO dates, not host timezone or fixed UTC offsets. Eight model tests.

Live implementation needs:
- server-authenticated merchant to shop ownership mapping, currently absent from this preview;
- completed_at maintained by server on valid fulfillment transition, not guessed from created_at (current customer Order interface only has createdAt);
- complete all-shop-order feed or aggregate RPC with current+prior calendar ranges, not paginated customer cache;
- published review scope/rating date and resolved moderation rules, not old profile rating;
- Cross-unit popularity uses number of completed orders containing each product, not addition of kilos and pieces. UI labels it الأكثر طلبًا.
- once-per-shop-per-week key and Friday scheduled aggregate/in-app inbox delivery, retry safety and access isolation;
- explicit publication/real-mode QA gate. Do not advertise automatic Friday delivery from this preview.

QA:519 app tests/build pass, new component/model scoped lint pass. Full Dashboard lint has existing Date.now render-purity error at original busyUntil calculation, not introduced.390 screenshot inspected.320 summary card fits but overall existing dashboard reports horizontal document overflow, not verified isolated to this patch. No false whole-dashboard320 claim.

## Demo revision
Verified demo ON now passes fictional24 completed orders versus20 previous week (+20%),5 published linked sample reviews (4.8/5), most-requested item and best Cairo day. Fixture dates derive from the latest completed period and all sample rows retain demo:true. OFF/unknown still uses honest unavailable state, no real feed or schedule claimed. No visible sample label per user request.
