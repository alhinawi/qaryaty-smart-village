import { describe, expect, it } from 'vitest';
import { resolveReply } from './assistantLive';
import { demoReply, type AssistantMessage } from './demoAssistant';

const history: AssistantMessage[] = [{ from: 'assistant', text: 'أهلاً بيك' }];

describe('resolveReply', () => {
  it('returns the live answer when the edge function answers', async () => {
    const reply = await resolveReply(history, 'رسوم التوصيل كام؟', 'customer', async () => ({ ok: true, text: 'التوصيل من 10 جنيه جوّه القرية' }));
    expect(reply).toBe('التوصيل من 10 جنيه جوّه القرية');
  });

  it('falls back to the canned engine when the function says quota', async () => {
    const reply = await resolveReply(history, 'النقاط بتشتغل إزاي؟', 'customer', async () => ({ ok: false, reason: 'quota' as const }));
    expect(reply).toBe(demoReply('النقاط بتشتغل إزاي؟', 'customer'));
  });

  it('falls back when the function is unavailable (no key / not deployed)', async () => {
    const reply = await resolveReply(history, 'أطلب إزاي؟', 'customer', async () => ({ ok: false, reason: 'unavailable' as const }));
    expect(reply).toBe(demoReply('أطلب إزاي؟', 'customer'));
  });

  it('falls back when the call throws (offline)', async () => {
    const reply = await resolveReply(history, 'أتابع طلبي منين؟', 'customer', async () => { throw new Error('network'); });
    expect(reply).toBe(demoReply('أتابع طلبي منين؟', 'customer'));
  });

  it('falls back when the function returns an empty text', async () => {
    const reply = await resolveReply(history, 'أحجز صنايعي إزاي؟', 'customer', async () => ({ ok: true, text: '  ' }));
    expect(reply).toBe(demoReply('أحجز صنايعي إزاي؟', 'customer'));
  });

  it('routes merchant roles to the merchant audience', async () => {
    let seen: string | undefined;
    await resolveReply(history, 'أضيف منتج إزاي؟', 'owner', async (_messages, audience) => { seen = audience; return { ok: false, reason: 'unavailable' as const }; });
    expect(seen).toBe('merchant');
  });

  it('routes customers to the customer audience', async () => {
    let seen: string | undefined;
    await resolveReply(history, 'أطلب إزاي؟', 'customer', async (_messages, audience) => { seen = audience; return { ok: false, reason: 'unavailable' as const }; });
    expect(seen).toBe('customer');
  });
});
