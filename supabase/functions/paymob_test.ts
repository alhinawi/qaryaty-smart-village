// cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env --allow-read --node-modules-dir=none paymob_test.ts
// Runs both functions with Paymob and the database faked through fetch.
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { verifyTransactionHmac } from './_shared/paymob.ts';

const HMAC_SECRET = 'test-hmac-secret';
const ORDER_ID = '11111111-2222-4333-8444-555555555555';

for (const [k, v] of Object.entries({
  SUPABASE_URL: 'https://db.test',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  PAYMOB_SECRET_KEY: 'sk_test',
  PAYMOB_PUBLIC_KEY: 'pk_test',
  PAYMOB_HMAC_SECRET: HMAC_SECRET,
  PAYMOB_CARD_INTEGRATION_ID: '111',
  PAYMOB_WALLET_INTEGRATION_ID: '222',
  APP_URL: 'https://app.test',
})) Deno.env.set(k, v);

// The database row and what was written to it
let row: Record<string, unknown>;
const updates: Record<string, unknown>[] = [];
let intentionBody: Record<string, unknown> | null = null;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const req = new Request(input, init);
  const url = new URL(req.url);
  if (url.host === 'accept.paymob.com' && url.pathname === '/v1/intention/') {
    intentionBody = await req.json();
    return Response.json({ client_secret: 'cs_1', intention_order_id: 777 }, { status: 201 });
  }
  if (url.host === 'db.test' && url.pathname === '/rest/v1/orders') {
    if (req.method === 'GET') {
      const byId = url.searchParams.get('id');
      const byPaymob = url.searchParams.get('paymob_order_id');
      const hit =
        (byId && byId === `eq.${row.id}`) || (byPaymob && byPaymob === `eq.${row.paymob_order_id}`);
      return Response.json(hit ? row : null, { status: hit ? 200 : 406 });
    }
    if (req.method === 'PATCH') {
      const patch = await req.json();
      updates.push(patch);
      if (!(url.searchParams.get('payment_status') === 'neq.paid' && row.payment_status === 'paid')) {
        row = { ...row, ...patch };
      }
      return new Response(null, { status: 204 });
    }
  }
  throw new Error(`unexpected fetch ${req.method} ${req.url}`);
}) as typeof fetch;

// Load each function's handler without starting a server
async function load(path: string): Promise<(req: Request) => Promise<Response>> {
  let handler: ((req: Request) => Promise<Response>) | undefined;
  const deno = Deno as unknown as { serve: unknown };
  const realServe = deno.serve;
  deno.serve = (h: (req: Request) => Promise<Response>) => {
    handler = h;
  };
  await import(path);
  deno.serve = realServe;
  return handler!;
}
const checkout = await load('./paymob-checkout/index.ts');
const webhook = await load('./paymob-webhook/index.ts');

async function sign(obj: Record<string, unknown>): Promise<string> {
  // Paymob's documented field order, signed independently of the code under test
  const fields = [obj.amount_cents, obj.created_at, obj.currency, obj.error_occured, obj.has_parent_transaction,
    obj.id, obj.integration_id, obj.is_3d_secure, obj.is_auth, obj.is_capture, obj.is_refunded,
    obj.is_standalone_payment, obj.is_voided, (obj.order as { id: number }).id, obj.owner, obj.pending,
    (obj.source_data as Record<string, string>).pan, (obj.source_data as Record<string, string>).sub_type,
    (obj.source_data as Record<string, string>).type, obj.success].map(String).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(fields));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function transaction(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 9001, amount_cents: 35500, created_at: '2026-11-04T12:00:00.000000', currency: 'EGP',
    error_occured: false, has_parent_transaction: false, integration_id: 111, is_3d_secure: true,
    is_auth: false, is_capture: false, is_refunded: false, is_standalone_payment: true, is_voided: false,
    order: { id: 777, merchant_order_id: `${ORDER_ID}:1730721600000` }, owner: 42, pending: false,
    source_data: { pan: '2346', sub_type: 'MasterCard', type: 'card' }, success: true,
    ...overrides,
  };
}

async function callWebhook(obj: Record<string, unknown>, hmac?: string): Promise<number> {
  const res = await webhook(new Request(`https://db.test/functions/v1/paymob-webhook?hmac=${hmac ?? (await sign(obj))}`, {
    method: 'POST', body: JSON.stringify({ type: 'TRANSACTION', obj }),
  }));
  await res.body?.cancel();
  return res.status;
}

Deno.test('checkout charges the database total, not the app', async () => {
  row = { id: ORDER_ID, order_number: 'Q-1', service_name: 'أسماك: بلطي', phone: '01012345678',
    total_amount: 355, is_estimate: false, payment_method: 'card', payment_status: 'unpaid',
    created_at: new Date().toISOString(), paymob_order_id: null };
  const res = await checkout(new Request('https://x/', { method: 'POST', body: JSON.stringify({ orderId: ORDER_ID, amount: 1 }) }));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(intentionBody?.amount, 35500);
  assertEquals(intentionBody?.payment_methods, [111]);
  assert(String(intentionBody?.special_reference).startsWith(`${ORDER_ID}:`));
  assertEquals(body.url, 'https://accept.paymob.com/unifiedcheckout/?publicKey=pk_test&clientSecret=cs_1');
  assertEquals(row.payment_status, 'pending');
  assertEquals(row.paymob_order_id, '777');
});

Deno.test('checkout refuses cash, estimates and paid orders', async () => {
  for (const change of [{ payment_method: 'cash' }, { is_estimate: true }, { payment_status: 'paid' }, { total_amount: 0 }]) {
    row = { ...row, payment_method: 'card', is_estimate: false, payment_status: 'unpaid', total_amount: 355, ...change };
    const res = await checkout(new Request('https://x/', { method: 'POST', body: JSON.stringify({ orderId: ORDER_ID }) }));
    await res.body?.cancel();
    assertEquals(res.status, 409, JSON.stringify(change));
  }
  row = { ...row, total_amount: 355, payment_status: 'pending', paymob_order_id: '777' };
});

Deno.test('webhook ignores a forged or tampered callback', async () => {
  assertEquals(await callWebhook(transaction(), 'f'.repeat(128)), 401);
  const real = transaction();
  const hmac = await sign(real);
  assertEquals(await callWebhook({ ...real, amount_cents: 100 }, hmac), 401);
  assertEquals(row.payment_status, 'pending');
});

Deno.test('webhook refuses a signed payment for the wrong amount', async () => {
  assertEquals(await callWebhook(transaction({ amount_cents: 100 })), 200);
  assertEquals(row.payment_status, 'failed');
  row = { ...row, payment_status: 'pending' };
});

Deno.test('webhook marks the order paid on a signed, matching success', async () => {
  assertEquals(await callWebhook(transaction()), 200);
  assertEquals(row.payment_status, 'paid');
  assert(row.paid_at);
  // A later failure for the same order doesn't undo it
  assertEquals(await callWebhook(transaction({ success: false })), 200);
  assertEquals(row.payment_status, 'paid');
});

Deno.test('webhook marks a paid order refunded on a signed refund or void', async () => {
  for (const flag of ['is_refunded', 'is_voided']) {
    row = { ...row, payment_status: 'paid' };
    // A refund for another amount, or an unsigned flag, changes nothing
    assertEquals(await callWebhook(transaction({ [flag]: true, amount_cents: 100 })), 200);
    assertEquals(row.payment_status, 'paid', flag);
    const forged = transaction();
    assertEquals(await callWebhook({ ...forged, [flag]: true }, await sign(forged)), 401);
    assertEquals(row.payment_status, 'paid', flag);
    // The signed refund/void of the paid amount is recorded
    assertEquals(await callWebhook(transaction({ [flag]: true })), 200);
    assertEquals(row.payment_status, 'refunded', flag);
    // A repeated success callback afterwards doesn't make it paid again
    assertEquals(await callWebhook(transaction()), 200);
    assertEquals(row.payment_status, 'refunded', flag);
  }
  // and checkout won't take a new payment for it
  const res = await checkout(new Request('https://x/', { method: 'POST', body: JSON.stringify({ orderId: ORDER_ID }) }));
  await res.body?.cancel();
  assertEquals(res.status, 409);
});

Deno.test('hmac helper matches an independent signature', async () => {
  const obj = transaction();
  assert(await verifyTransactionHmac(obj, await sign(obj), HMAC_SECRET));
  assert(!(await verifyTransactionHmac(obj, await sign(obj), 'other')));
});
