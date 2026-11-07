# Batch 15: consistent open-now status

- New `src/utils/shopOpenNow.ts`: `isShopOpenNow(shop, now)` reads the stored hours text ("⏰ 7ص - 12م" / "⏰ 24 ساعة") against Africa/Cairo time. The merchant's manual «مغلق» always wins; readable hours close the shop outside their range; unreadable or missing hours fall back to the manual flag alone, so older free-text rows behave as before.
- Customer surfaces now use it everywhere the static `shop.open` showed before: ShopCard (badge, busy ribbon, click guard), SearchScreen (open check, open-first sort, tile overlay and labels, result meta), CatalogDetail (status line, disabled order button).
- Checkout enforcement: a shop cart that was filled while the shop was open is re-checked at confirm time in CartDrawer and refused with the same «مغلق حالياً، بيفتح …» wording.
- Same-device mirror: the merchant dashboard's open/hours toggles now reach the customer shop list the way the «مشغول» mirror already did, so the merchant previews exactly what customers will see.
- Not done here (needs the server-backed merchant controls track): DB-side order enforcement and cross-device propagation of the toggles.

## Merchant sync slice (same batch)

- `saveShopBasics(shopId, update)` in the repositories layer writes the merchant dashboard's open/busy/hours/description edits to the merchant's own `shops` row (RLS: owner edits own, staff keep admin policies). Payload carries only the changed fields.
- Dashboard toggles save to the device mirror first, then sync best-effort; a failed server sync shows «اتحفظ على الجهاز بس — التعديل على السيرفر ماتحفظش» instead of pretending.
- Still device-only (next runs): product price/availability overrides and merchant-added products (shop_product_overrides / shop_custom_products tables exist but the editor isn't wired), photo upload to the shop-images bucket, owned-shops gating for non-admin merchant accounts, customer-side merge of the override tables into getProducts.
- Stale copy to fix with a preview: the dashboard header still says every edit stays on the device, and «احفظ البيانات» still says "(على جهازك في المعاينة)".
