// ─── App commission (عمولة التطبيق)
// A percentage of what the customer pays for the order (after the first-order
// discount), added to every order: shop carts, restaurants, the pharmacy, gas,
// craftsmen, teachers, every provider request. It shows only at the payment
// step, as its own line, and never on cards, menus or prices.
//
// • Rounded to the nearest whole pound.
// • Never under APP_COMMISSION_MIN or over APP_COMMISSION_MAX.
// • Nothing on an order with nothing to pay (a free first order, a price of 0).
// • A price set after confirmation has no amount yet, so no commission is
//   added at ordering; the customer sees that the percentage comes on top.
//
// The server computes the same thing itself: public.app_commission_percent(),
// public.app_commission_min(), public.app_commission_max() in
// supabase/schema.sql. Change both together (a test checks they match).
export const APP_COMMISSION_PERCENT = 5;

/** Smallest commission in EGP on an order that has something to pay. */
export const APP_COMMISSION_MIN = 1;

/** Largest commission in EGP on one order, so big orders aren't overcharged. */
export const APP_COMMISSION_MAX = 50;

export const APP_COMMISSION_LABEL = `عمولة التطبيق (${APP_COMMISSION_PERCENT}%)`;
