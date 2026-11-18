// ─── مساعد قريتي on Cloudflare Pages: same answers as the Supabase function, no database
// Pages Function at /api/assistant. Groq first, then Gemini; any failure answers
// { ok: false } and the app falls back to its canned replies.
// Keys are Cloudflare Pages secrets (GROQ_API_KEY, GEMINI_API_KEY), never in the bundle.
// Nothing here talks to Supabase: the per-visitor daily cap is kept in the Cloudflare
// edge cache, best effort per data center, so no shared counters are written.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const GEMINI_MODEL = 'gemini-3.8-flash';
const DAILY_CAP = 20;
const MAX_TEXT = 600;
const MAX_HISTORY = 4;
// Both providers together must finish inside the app's 9 second wait.
const PROVIDER_TIMEOUT_MS = 4000;
const MAX_TOKENS = 150;
// Gemini counts its hidden thinking tokens inside this cap, so 150 cut answers off mid-sentence.
const GEMINI_MAX_TOKENS = 600;

const SYSTEM_CUSTOMER = `انت «مساعد قريتي» في تطبيق قريتي لخدمات القرية. رد بالمصري العامي، جملة أو اتنين كحد أقصى، من غير ايموجي أسهم.
اللي تعرفه بس: محلات ومطاعم وصيدليات بتطلب منها وتوصل لحد البيت، خدمة مرسول للتوصيل، توكتوك، صنايعية ومدرسين بيتحجزوا، نقاط على الطلبات، آراء العملاء. مفيش قسم سوبر ماركت خالص — لو حد سأل عنه قوله مرسول هيوصله أي حاجة. ماتخترعش أسعار ولا مواعيد، وماتقولش إن محل مفتوح أو مقفول دلوقتي؛ لو مش متأكد قول «مش متأكد» وانصحه يكلّم الدعم.`;

const SYSTEM_MERCHANT = `انت «مساعد قريتي» لأصحاب المحلات والصنايعية في تطبيق قريتي. رد بالمصري العامي، جملة أو اتنين كحد أقصى، من غير ايموجي أسهم.
ساعده في لوحة التحكم: إضافة منتج وسعره وصورته، مفتاح الإتاحة لما المنتج يخلص (بشارة «خلصان»)، متابعة الطلبات وحالتها. ماتخترعش أرقام ولا سياسات؛ لو مش متأكد قول «مش متأكد» وانصحه يكلّم الدعم.`;

export interface Env {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

interface ChatMessage {
  from: 'user' | 'assistant';
  text: string;
}

export interface Deps {
  fetchFn: typeof fetch;
  /** Returns true when the visitor still has replies left today (and counts this one). */
  takeQuota: (visitorKey: string) => Promise<boolean>;
}

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export function cleanMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw.slice(-MAX_HISTORY)) {
    const from = (item as { from?: unknown })?.from;
    const text = (item as { text?: unknown })?.text;
    if ((from !== 'user' && from !== 'assistant') || typeof text !== 'string') continue;
    const trimmed = text.trim().slice(0, MAX_TEXT);
    if (trimmed) out.push({ from, text: trimmed });
  }
  return out;
}

async function askGroq(fetchFn: typeof fetch, key: string | undefined, system: string, messages: ChatMessage[]): Promise<string | null> {
  if (!key) return null;
  try {
    const res = await fetchFn(GROQ_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.4,
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: system },
          ...messages.map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

async function askGemini(fetchFn: typeof fetch, key: string | undefined, system: string, messages: ChatMessage[]): Promise<string | null> {
  if (!key) return null;
  try {
    const res = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.from === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
        generationConfig: { maxOutputTokens: GEMINI_MAX_TOKENS, temperature: 0.4 },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

/** Core handler, injectable for tests. Always answers 200 with ok true/false except for bad input. */
export async function handleAssistant(req: Request, env: Env, deps: Deps): Promise<Response> {
  if (req.method !== 'POST') return json({ ok: false, reason: 'bad_request' }, 405);
  try {
    const body = (await req.json()) as { messages?: unknown; audience?: unknown };
    const messages = cleanMessages(body?.messages);
    if (!messages.length || messages[messages.length - 1].from !== 'user') {
      return json({ ok: false, reason: 'bad_request' }, 400);
    }
    const audience = body?.audience === 'merchant' ? 'merchant' : 'customer';
    const visitor = (req.headers.get('CF-Connecting-IP') ?? 'unknown').slice(0, 64);
    if (!(await deps.takeQuota(visitor))) return json({ ok: false, reason: 'quota' });

    const system = audience === 'merchant' ? SYSTEM_MERCHANT : SYSTEM_CUSTOMER;
    const text = (await askGroq(deps.fetchFn, env.GROQ_API_KEY, system, messages)) ?? (await askGemini(deps.fetchFn, env.GEMINI_API_KEY, system, messages));
    return text ? json({ ok: true, text }) : json({ ok: false, reason: 'unavailable' });
  } catch {
    return json({ ok: false, reason: 'unavailable' });
  }
}

// Best-effort daily counter in the edge cache (per data center). It never touches Supabase.
// Groq's own free-tier limit remains the hard ceiling; hitting it just means canned replies.
const memory = new Map<string, number>();

async function takeQuotaFromCache(visitorKey: string): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const memKey = `${day}:${visitorKey}`;
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  let count = memory.get(memKey) ?? 0;
  const cacheReq = new Request(`https://assistant-quota.invalid/${day}/${encodeURIComponent(visitorKey)}`);
  try {
    if (cache) {
      const hit = await cache.match(cacheReq);
      if (hit) count = Math.max(count, Number(await hit.text()) || 0);
    }
  } catch {
    // cache unavailable: the in-memory counter still bounds this isolate
  }
  if (count >= DAILY_CAP) return false;
  count += 1;
  memory.set(memKey, count);
  if (memory.size > 5000) memory.clear();
  try {
    if (cache) await cache.put(cacheReq, new Response(String(count), { headers: { 'Cache-Control': 'max-age=86400' } }));
  } catch {
    // ignore
  }
  return true;
}

export const onRequest = (context: { request: Request; env: Env }): Promise<Response> =>
  handleAssistant(context.request, context.env, { fetchFn: fetch, takeQuota: takeQuotaFromCache });
