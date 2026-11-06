// ─── رسوم التوصيل (delivery fee)
// Paid on a cart order from a shop or restaurant: the customer gets a product
// brought to his door. Service orders (plumber, teacher, nurse, the gas cylinder…)
// never pay it; a provider's own delivery fee (الأنبوبة) stays inside the service price.
//
// • Its own line in the price breakdown, and its own column (orders.delivery_fee).
// • Not part of عمولة التطبيق: the commission is on the items only.
// • QARYA1 doesn't waive it: it goes to the courier.
//
// The live number is on the server (public.delivery_fee_quote, which the order
// trigger uses too):
//   app_settings 'delivery_fee_default'  the fee inside the village
//   shops.delivery_fee                    a shop's own fee instead (null: default)
//   villages.delivery_fee                 a farther village (the higher one wins)
// Admins change them in Supabase (Table Editor) until the admin dashboard has them.
// This number is only what the app shows when it can't ask the server; keep it
// equal to the one in supabase/migrations/20261106210000_delivery_fee.sql.
export const DELIVERY_FEE_DEFAULT = 10;

export const DELIVERY_FEE_LABEL = 'رسوم التوصيل';
