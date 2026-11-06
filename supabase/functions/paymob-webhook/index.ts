// Paymob's "transaction processed" callback (POST, ?hmac=...).
//
// The only place an order becomes paid. Nothing is trusted before the HMAC
// matches; then the amount and currency must match the order as the
// database priced it. Deploy with --no-verify-jwt: Paymob sends no Supabase token.
import { adminClient, env, toCents, verifyTransactionHmac } from '../_shared/paymob.ts';

const ok = () => new Response('ok', { status: 200 });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const hmac = new URL(req.url).searchParams.get('hmac') ?? '';
  let body: { type?: string; obj?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }
  const tx = body.obj;
  if (body.type !== 'TRANSACTION' || !tx || !hmac) return new Response('ignored', { status: 400 });

  if (!(await verifyTransactionHmac(tx, hmac, env('PAYMOB_HMAC_SECRET')))) {
    console.warn('paymob webhook: bad hmac');
    return new Response('forbidden', { status: 401 });
  }

  const paymobOrderId = String((tx.order as Record<string, unknown> | undefined)?.id ?? '');
  const merchantRef = String((tx.order as Record<string, unknown> | undefined)?.merchant_order_id ?? '');
  const db = adminClient();
  const { data: order, error } = await db
    .from('orders')
    .select('id, total_amount, payment_status')
    .eq('paymob_order_id', paymobOrderId)
    .maybeSingle();
  if (error) return new Response('database error', { status: 500 }); // Paymob retries
  if (!order) {
    console.warn('paymob webhook: unknown order', paymobOrderId);
    return ok();
  }
  if (merchantRef && !merchantRef.startsWith(`${order.id}:`)) {
    console.warn('paymob webhook: reference mismatch', paymobOrderId, merchantRef);
    return ok();
  }
  const amountMatches = Number(tx.amount_cents) === toCents(order.total_amount) && tx.currency === 'EGP';
  // is_refunded / is_voided are among the HMAC-signed fields, so they can be trusted here
  const reversed = tx.is_refunded === true || tx.is_voided === true;

  if (order.payment_status === 'refunded') return ok(); // final
  if (order.payment_status === 'paid') {
    // Repeats of the payment are normal and change nothing. A refund or void of
    // the paid amount must not be dropped: the shop would deliver an order whose
    // money went back to the customer.
    if (reversed && amountMatches) {
      const { error: refundError } = await db
        .from('orders')
        .update({ payment_status: 'refunded' })
        .eq('id', order.id)
        .eq('payment_status', 'paid');
      if (refundError) return new Response('database error', { status: 500 }); // Paymob retries
    } else if (reversed) {
      console.warn('paymob webhook: refund amount mismatch', order.id, tx.amount_cents);
    }
    return ok();
  }
  const settled =
    tx.success === true && tx.pending === false && tx.is_voided !== true && tx.is_refunded !== true;

  if (settled && amountMatches) {
    await db
      .from('orders')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', order.id);
  } else if (tx.pending !== true) {
    if (settled && !amountMatches) console.warn('paymob webhook: amount mismatch', order.id, tx.amount_cents);
    await db.from('orders').update({ payment_status: 'failed' }).eq('id', order.id).neq('payment_status', 'paid');
  }
  return ok();
});
