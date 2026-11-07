// ─── مساعد قريتي: assistant-reply edge function (PREPARED, not deployed) ───
// Secure path for live AI answers: the Groq/Gemini keys live ONLY here
// (supabase secrets), never in the app bundle. Plan: docs/proposals/ai-assistant.md
//
// POST { messages: [{from:'user'|'assistant', text}], audience: 'customer'|'merchant' }
// → 200 { ok: true, text }                    live answer (Groq, then Gemini)
// → 200 { ok: false, reason: 'quota' }        daily cap reached → app uses canned replies
// → 200 { ok: false, reason: 'unavailable' }  both providers failed → app uses canned replies
//
// Quota: per-user per-day cap (20) in public.assistant_usage
// (migration 20261108050000, pending owner OK). If the table is not there
// yet, the function answers without counting instead of failing.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const GEMINI_MODEL = 'gemini-3.8-flash';
const DAILY_CAP = 20;

const SYSTEM_CUSTOMER = `انت «مساعد قريتي»، مساعد تطبيق قريتي لخدمات القرية في مصر. جاوب بالمصري العامي البسيط، باختصار (سطرين أو تلاتة)، ومن غير ايموجي أسهم.
قواعد صارمة: ماتخترعش أسعار ولا مواعيد ولا وعود. اللي تعرفه بس: التطبيق فيه محلات وسوبر ماركت وصيدليات ومطاعم، وطلبات بتوصل لحد البيت، وصنايعية ومدرسين بيتحجزوا، وخدمة مرسول للتوصيل، وتوكتوك، ونقاط على الطلبات، وآراء العملاء بتتكتب على المحلات والمنتجات. لو مش متأكد قول «مش متأكد» وانصحه يكلّم الدعم.`;

const SYSTEM_MERCHANT = `انت «مساعد قريتي»، مساعد أصحاب المحلات والصنايعية في تطبيق قريتي. جاوب بالمصري العامي البسيط، باختصار (سطرين أو تلاتة)، ومن غير ايموجي أسهم.
ساعده في لوحة التحكم: إضافة منتج وتسعيره، مفتاح الإتاحة لما المنتج يخلص (بيظهر بشارة «خلصان»)، متابعة الطلبات وتغيير حالتها، رقم الواتساب للإشعارات. ماتخترعش أرقام مبيعات ولا سياسات. لو مش متأكد قول «مش متأكد» وانصحه يكلّم الدعم.`;

interface ChatMessage { from: 'user' | 'assistant'; text: string }

function cors(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  return new Response(res.body, { status: res.status, headers });
}

function json(body: unknown, status = 200): Response {
  return cors(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

async function askGroq(system: string, messages: ChatMessage[]): Promise<string | null> {
  const key = Deno.env.get('GROQ_API_KEY');
  if (!key) return null;
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 220,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          ...messages.slice(-8).map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

async function askGemini(system: string, messages: ChatMessage[]): Promise<string | null> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.slice(-8).map((m) => ({
            role: m.from === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
          generationConfig: { maxOutputTokens: 220, temperature: 0.4 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

// Per-user daily cap. Fails OPEN (answers without counting) when the usage
// table is not migrated yet, so the feature never breaks on a missing table.
async function quotaLeft(userKey: string): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey || !userKey) return true;
  const day = new Date().toISOString().slice(0, 10);
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  try {
    const found = await fetch(`${url}/rest/v1/assistant_usage?user_key=eq.${encodeURIComponent(userKey)}&day=eq.${day}&select=count`, { headers });
    if (!found.ok) return true; // table missing → no quota yet
    const rows = await found.json();
    const count = rows?.[0]?.count ?? 0;
    if (count >= DAILY_CAP) return false;
    await fetch(`${url}/rest/v1/assistant_usage`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ user_key: userKey, day, count: count + 1 }),
    });
    return true;
  } catch {
    return true;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors(new Response('ok'));
  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const audience = body?.audience === 'merchant' ? 'merchant' : 'customer';
    if (!messages.length || typeof messages[messages.length - 1]?.text !== 'string') {
      return json({ ok: false, reason: 'bad_request' }, 400);
    }
    const userKey = (req.headers.get('x-user-key') ?? req.headers.get('x-forwarded-for') ?? '').slice(0, 80);
    if (!(await quotaLeft(userKey))) return json({ ok: false, reason: 'quota' });

    const system = audience === 'merchant' ? SYSTEM_MERCHANT : SYSTEM_CUSTOMER;
    const text = (await askGroq(system, messages)) ?? (await askGemini(system, messages));
    return text ? json({ ok: true, text }) : json({ ok: false, reason: 'unavailable' });
  } catch {
    return json({ ok: false, reason: 'unavailable' });
  }
});
