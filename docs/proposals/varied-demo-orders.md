# Varied display-only order history

Six authored fixtures attached to existing sample shop names:3delivered,1onway,1preparing,1cancelled. Verified tracking-demo gate hides whole section immediately OFF/unknown. Fixtures never enter ordinary order store, customer account history, DB, payments or reviewsRepo. Local review panel unlocks only for delivered fixtures, held in component memory and reset across account scopes. It cannot publish a fake verified customer review. Real OrderReviewAction unchanged. Header includes6when enabled; legacy two initial fixture cards hidden to prevent duplication. No real address or phone shown. QA390/320 no overflow,3review buttons only, local review submit and immediate off-gate hide tested.511 app tests/build/new-file lint pass. Screenshot inspected at native3x.

## Tracking revision

Each sample card has تتبع الطلب, timeline and local الخطوة الجاية. Preparing→onway→delivered, cancelled has no advance, delivered review unlocks immediately. Account-scoped component remount clears progress; no real order mutation or server request. Click checks verified demo flag again.390/320 preparing→onway→delivered and new review eligibility verified; no overflow. Screenshot inspected.511 tests/build/newfile lint.

## Separate review targets

Delivered only: two independent star/comment sets for shop/provider and rider/delivery. Pickup fixture has shop review only, no rider block. Both local component memory only, no fake review publishing or server queue. Verified demo gate checked again on submit.390/320 dualform and pickup singleform browser assertions passed. UI may not attach invented rider identity; only category label.
