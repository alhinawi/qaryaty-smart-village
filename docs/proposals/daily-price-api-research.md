# Daily price board research - 7 November 2026

Recommendation: launch the board with merchant-entered actual selling prices, then add a separate optional wholesale/reference panel only after data-use permission and a stable source contract are verified. An external reference price is never the merchant's checkout price. No production-ready, freely reusable API for daily retail prices in the user's village was verified in this pass.

## Ranked fit
1. Merchant updates: best for actual local selling price and availability. Needs authenticated server-side shop ownership, unit, server update time and freshness rules. No external data fee or signup needed for this approach.
2. Obour market: strongest verified Egyptian daily wholesale-reference lead. Official site says it updates from morning auction prices; Cairo governorate confirms wholesale semantics. Download statistics access requires an application/approved entity letter. No open API or commercial redistribution license was verified. The fetched date is literally `5/11/2026`; date locale/freshness unresolved. Do not call it today's source until resolved.
3. Agriculture ministry / national price portal: relevant official sources, but fetched ministry page showed table headers only and the price portal returned title only. A current populated feed, API, geographic detail and commercial reuse terms remain unverified.
4. WFP/HDX: useful historical/context data, not a daily board. Egypt metadata says monthly update and observed coverage ends 15 September 2026. WFP daily API documentation exists but is restricted and does not prove daily Egypt coverage or permission for this product. Preserve actual/estimated/forecast flags.
5. Global commodity APIs: API exists, but quoted units such as metric ton/cwt/lb and global wheat/rice/sugar symbols do not establish the retail price of tomatoes, meat or fruit in a village. Do not buy a plan for this use based on that documentation.

## Proposed product rules
- Merchant price: shop + product + explicit EGP/unit + available + server updated_at; show the actual update date/time. Use Cairo calendar date for “today.” Stale/unavailable prices never silently remain “today.”
- External reference: separate visual panel and database source type, source market, min/max/unit, collected date, fetch date, source link and access/license status. No automatic overwrite of merchant prices or checkout.
- Validate nonnegative price, consistent unit, item-grade match and range ordering. Source zeros/missing bounds are unknown, not free products.
- No data subscription, account, API key, scraping monitor or paid integration was created. API adapter should remain disabled until access and reuse terms, freshness and item mapping are settled.

## Sources
See sources.md for the claim-level ledger. Principal links:
- http://www.oboormarket.org.eg/Prices_ar.aspx
- http://www.oboormarket.org.eg/download_prices.aspx
- https://cairo.gov.eg/ar/governorate-entities/projects/obour-market/services/
- https://www.agri.gov.eg/databases/83
- http://www.agriprice.gov.eg/local-prices/1
- https://data.humdata.org/dataset/wfp-food-prices-for-egypt
- https://github.com/WFP-VAM/DataBridgesAPI/blob/main/docs/MarketPricesApi.md
- https://help.commodities-api.com/article/20-latest-rates-endpoint
- https://www.elwatannews.com/news/details/7255597
