// ─── Online payment through Paymob
//
// The app never holds a Paymob key and never marks an order paid. It asks the
// `paymob-checkout` Edge Function for a checkout page for an order already
// saved; the function charges the total the database computed. Paymob then
// tells the `paymob-webhook` function the result, which checks the HMAC and
// only then sets the order paid. See supabase/functions/README.md.

import type { PaymentMethod } from '@/types';
import { isSupabaseConfigured } from '@/repositories/supabaseClient';

export { startOnlinePayment } from '@/repositories/payments/supabasePaymentRepo';

/** Shown only when the project turned Paymob on (VITE_PAYMOB_ENABLED=true) and has a backend. */
export const ONLINE_PAYMENTS_ENABLED =
  import.meta.env.VITE_PAYMOB_ENABLED === 'true' && isSupabaseConfigured;

export function isOnlinePayment(method: PaymentMethod): method is 'card' | 'wallet' {
  return method === 'card' || method === 'wallet';
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'كاش عند الاستلام 💵',
  card: 'فيزا أو ميزة (أونلاين) 💳',
  wallet: 'محفظة: فودافون كاش وغيرها 📱',
  vodafone: 'فودافون كاش (تحويل) 📱',
  instapay: 'انستاباي ⚡',
};

/** The choices the order forms offer. Online ones need a fixed price. */
export function paymentChoices(hasFixedPrice: boolean): PaymentMethod[] {
  return ONLINE_PAYMENTS_ENABLED && hasFixedPrice ? ['cash', 'card', 'wallet'] : ['cash'];
}

/**
 * After Paymob sends the user back (?payment=paymob&success=…). The query is
 * only a hint for the message: the order is paid when the webhook says so.
 */
export function readPaymentReturn(search: string): 'success' | 'failed' | null {
  const params = new URLSearchParams(search);
  if (params.get('payment') !== 'paymob') return null;
  return params.get('success') === 'true' ? 'success' : 'failed';
}
