import { describe, expect, it } from 'vitest';
import { cleanMessages, handleAssistant, type Deps } from '../../../functions/api/assistant';
import { isCloudflarePagesHost } from './assistantLive';

const req = (body: unknown, method = 'POST') =>
  new Request('https://qaryaty.pages.dev/api/assistant', { method, body: method === 'POST' ? JSON.stringify(body) : undefined });
const ok = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text } }], candidates: [{ content: { parts: [{ text }] } }] }));
const bad = () => new Response('no', { status: 500 });
const allow: Deps['takeQuota'] = async () => true;
const q = { messages: [{ from: 'user', text: 'التوصيل بكام؟' }], audience: 'customer' };

describe('pages assistant function', () => {
  it('answers from Groq first', async () => {
    const urls: string[] = [];
    const res = await handleAssistant(req(q), { GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' }, { takeQuota: allow, fetchFn: (async (u: string) => { urls.push(u); return ok('رد جروك'); }) as unknown as typeof fetch });
    expect(await res.json()).toEqual({ ok: true, text: 'رد جروك' });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('groq.com');
  });
  it('falls back to Gemini when Groq fails', async () => {
    const fetchFn = (async (u: string) => (u.includes('groq') ? bad() : ok('رد جيميني'))) as unknown as typeof fetch;
    const res = await handleAssistant(req(q), { GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' }, { takeQuota: allow, fetchFn });
    expect(await res.json()).toEqual({ ok: true, text: 'رد جيميني' });
  });
  it('says unavailable when both fail or keys are missing', async () => {
    const fetchFn = (async () => bad()) as unknown as typeof fetch;
    expect(await (await handleAssistant(req(q), { GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' }, { takeQuota: allow, fetchFn })).json()).toEqual({ ok: false, reason: 'unavailable' });
    expect(await (await handleAssistant(req(q), {}, { takeQuota: allow, fetchFn })).json()).toEqual({ ok: false, reason: 'unavailable' });
  });
  it('reports quota without calling a provider', async () => {
    let called = false;
    const fetchFn = (async () => { called = true; return ok('x'); }) as unknown as typeof fetch;
    const res = await handleAssistant(req(q), { GROQ_API_KEY: 'g' }, { takeQuota: async () => false, fetchFn });
    expect(await res.json()).toEqual({ ok: false, reason: 'quota' });
    expect(called).toBe(false);
  });
  it('rejects bad input and non-POST', async () => {
    const deps = { takeQuota: allow, fetchFn: (async () => ok('x')) as unknown as typeof fetch };
    expect((await handleAssistant(req({ messages: [] }), {}, deps)).status).toBe(400);
    expect((await handleAssistant(req({}, 'GET'), {}, deps)).status).toBe(405);
  });
  it('trims and bounds the history', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ from: 'user', text: `س${i}`.padEnd(900, 'ا') }));
    const cleaned = cleanMessages(many);
    expect(cleaned).toHaveLength(4);
    expect(cleaned[0].text.length).toBe(600);
  });
  it('uses the function only on the Cloudflare hostname', () => {
    expect(isCloudflarePagesHost('qaryaty.pages.dev')).toBe(true);
    expect(isCloudflarePagesHost('abc123.qaryaty.pages.dev')).toBe(true);
    expect(isCloudflarePagesHost('qaryaty.vercel.app')).toBe(false);
    expect(isCloudflarePagesHost('evilqaryaty.pages.dev')).toBe(false);
  });
});
