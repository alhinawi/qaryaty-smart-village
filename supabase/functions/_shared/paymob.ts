// Shared by paymob-checkout and paymob-webhook. Runs on Supabase Edge Functions (Deno).
import { createClient } from 'npm:@supabase/supabase-js@2';

export function env(name: string, fallback?: string): string {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`missing secret ${name}`);
  return value;
}

/** Egypt's API. Set PAYMOB_BASE_URL only for another region. */
export const paymobBase = () => env('PAYMOB_BASE_URL', 'https://accept.paymob.com').replace(/\/$/, '');

/** Service-role client: these functions are the only code that may change payment columns. */
export function adminClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Piasters, as Paymob counts them. */
export const toCents = (pounds: number) => Math.round(Number(pounds) * 100);

// The fields Paymob signs on a "transaction processed" callback, in its order.
const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

function pick(obj: Record<string, unknown>, path: string): string {
  let value: unknown = obj;
  for (const key of path.split('.')) {
    value = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
  }
  return value === undefined || value === null ? '' : String(value);
}

/** HMAC-SHA512 of the signed fields, hex, compared in constant time. */
export async function verifyTransactionHmac(
  obj: Record<string, unknown>,
  received: string,
  secret: string
): Promise<boolean> {
  const message = HMAC_FIELDS.map((f) => pick(obj, f)).join('');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const expected = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
  const given = received.toLowerCase();
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
