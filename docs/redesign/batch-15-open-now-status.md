# Batch 15: consistent open-now status

- New `src/utils/shopOpenNow.ts`: `isShopOpenNow(shop, now)` reads the stored hours text ("⏰ 7ص - 12م" / "⏰ 24 ساعة") against Africa/Cairo time. The merchant's manual «مغلق» always wins; readable hours close the shop outside their range; unreadable or missing hours fall back to the manual flag alone, so older free-text rows behave as before.
- Customer surfaces now use it everywhere the static `shop.open` showed before: ShopCard (badge, busy ribbon, click guard), SearchScreen (open check, open-first sort, tile overlay and labels, result meta), CatalogDetail (status line, disabled order button).
- Checkout enforcement: a shop cart that was filled while the shop was open is re-checked at confirm time in CartDrawer and refused with the same «مغلق حالياً، بيفتح …» wording.
- Same-device mirror: the merchant dashboard's open/hours toggles now reach the customer shop list the way the «مشغول» mirror already did, so the merchant previews exactly what customers will see.
- Not done here (needs the server-backed merchant controls track): DB-side order enforcement and cross-device propagation of the toggles.
