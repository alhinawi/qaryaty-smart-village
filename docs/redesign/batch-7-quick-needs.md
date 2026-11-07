# Batch 7: quick needs preview

Home now has a collapsible «محتاج دلوقتي» shortcut to pharmacy, grocery and delivery catalog choices. At most four links per category, two delivery-service types currently match (supermarket errands and tuk-tuk). It uses the existing catalog/store and detail routes, does not fabricate vendors, does not place an order, and does not alter the global search or filters.

## What it can honestly promise

Fewer steps to details. It does NOT yet meet the original idea's full promise of currently-open pharmacies/supermarkets or available riders. The panel states this explicitly and has no new open/availability badges. It is a local UI preview, not a completed opening-status fix.

## Why not derive live availability from existing flags?

Current `shop.open` is a static row flag, Home does not consistently merge merchant open/hours overrides, and `parseOpeningHours` intentionally returns defaults on unknown text. An opening-only value such as «يفتح 2م» supplies no closing time. The dashboard's open flag does not distinguish manual pause from an old daily status snapshot. Applying a schedule can reopen a manually paused shop or close one without proven hours. No current provider-online feed proves delivery availability. This is not a safe small display-only calculation.

The opening-status todo remains unresolved. Before changing order gates, a single rule/source for manual close precedence, valid hours and expiry must be agreed and applied consistently to cards, search, detail, menu and server checkout. No DB change has been applied or proposed as already authorized here.

## Checks

544 unit tests in 89 files pass; production build passes; full lint has 0 errors and 5 inherited Fast Refresh warnings. At 320/360/390/430/768/1024/1440/1920: opening the panel, choosing all three categories and following a detail link per category worked; no JS errors or horizontal overflow. Native 3x mobile panel screenshots inspected. Fixed header/nav are hidden in those isolated screenshots only. No real account, live catalog, real-time availability or order submission is claimed.
