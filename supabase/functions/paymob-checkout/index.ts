// POST { orderId } -> { url } of Paymob's checkout page for that order.
//
// The amount comes from the database (orders.total_amount, which the order
// trigger computed from catalog_products), never from the app. The order is
// marked 'pending' here; only paymob-webhook marks it paid.
import { adminClient, corsHeaders, env, json, paymobBase, toCents } from '../_shared/paymob.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ORDER_AGE_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const orderId = await req
    .json()
    .then((body) => String(body?.orderId ?? ''))
    .catch(() => '');
  if (!UUID.test(orderId)) return json({ error: 'bad order id' }, 400);

  const db = adminClient();
  const { data: order, error } = await db
    .from('orders')
    .select('id, order_number, service_name, phone, total_amount, is_estimate, payment_method, payment_status, created_at')
    .eq('id', orderId)
    .maybeSingle();
  if (error) return json({ error: 'database error' }, 500);
  if (!order) return json({ error: 'order not found' }, 404);

  if (order.payment_method !== 'card' && order.payment_method !== 'wallet') {
    return json({ error: 'this order is not paid online' }, 409);
  }
  if (order.payment_status === 'paid') return json({ error: 'already paid' }, 409);
  if (order.payment_status === 'refunded') return json({ error: 'payment was refunded' }, 409);
  if (order.is_estimate || order.total_amount === null || Number(order.total_amount) <= 0) {
    return json({ error: 'order has no fixed price' }, 409);
  }
  if (Date.now() - new Date(order.created_at).getTime() > MAX_ORDER_AGE_MS) {
    return json({ error: 'order is too old to pay online' }, 409);
  }

  const amount = toCents(order.total_amount);
  const integrationId = Number(
    order.payment_method === 'card'
      ? env('PAYMOB_CARD_INTEGRATION_ID')
      : env('PAYMOB_WALLET_INTEGRATION_ID')
  );
  const functionsUrl = `${env('SUPABASE_URL').replace(/\/$/, '')}/functions/v1`;
  const appUrl = env('APP_URL').replace(/\/$/, '');

  const response = await fetch(`${paymobBase()}/v1/intention/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${env('PAYMOB_SECRET_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'EGP',
      payment_methods: [integrationId],
      items: [{ name: String(order.service_name).slice(0, 50), amount, quantity: 1 }],
      billing_data: {
        first_name: 'Qaryaty',
        last_name: 'Customer',
        email: env('PAYMOB_BILLING_EMAIL', 'customer@example.com'),
        phone_number: order.phone,
        country: 'EG',
      },
      // Unique per attempt (Paymob refuses a repeated reference); starts with our id
      special_reference: `${order.id}:${Date.now()}`,
      notification_url: `${functionsUrl}/paymob-webhook`,
      redirection_url: `${appUrl}/?payment=paymob`,
    }),
  });
  const intention = await response.json().catch(() => null);
  if (!response.ok || !intention?.client_secret || !intention?.intention_order_id) {
    console.error('paymob intention failed', response.status, intention);
    return json({ error: 'payment provider error' }, 502);
  }

  // Keep Paymob's order id: the webhook finds the order by it
  const { error: saveError } = await db
    .from('orders')
    .update({ payment_status: 'pending', paymob_order_id: String(intention.intention_order_id) })
    .eq('id', order.id)
    .neq('payment_status', 'paid');
  if (saveError) return json({ error: 'database error' }, 500);

  const url =
    `${paymobBase()}/unifiedcheckout/?publicKey=${encodeURIComponent(env('PAYMOB_PUBLIC_KEY'))}` +
    `&clientSecret=${encodeURIComponent(intention.client_secret)}`;
  return json({ url });
});
