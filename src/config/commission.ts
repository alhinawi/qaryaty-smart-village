// ─── App commission (عمولة التطبيق)
// One fixed fee in EGP added to every order: shop carts, restaurants, the
// pharmacy, gas, craftsmen, teachers, every provider request. It shows only at
// the payment step, as its own line, and never on cards, menus or prices.
//
// The server adds the same fee itself: public.app_commission() in
// supabase/schema.sql. Change both together (a test checks they match).
export const APP_COMMISSION = 5;

export const APP_COMMISSION_LABEL = 'عمولة التطبيق';
