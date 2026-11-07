import { describe, expect, it } from 'vitest';
import {
  FALLBACK_REPLY,
  assistantAudienceFor,
  demoReply,
  greetingFor,
  quickPromptsFor,
} from './demoAssistant';

describe('assistantAudienceFor', () => {
  it('customers and guests get the customer audience', () => {
    expect(assistantAudienceFor('customer')).toBe('customer');
    expect(assistantAudienceFor(null)).toBe('customer');
    expect(assistantAudienceFor(undefined)).toBe('customer');
  });

  it('every staff tier gets the merchant audience', () => {
    for (const role of ['orders_admin', 'content_admin', 'admin', 'owner'] as const) {
      expect(assistantAudienceFor(role)).toBe('merchant');
    }
  });
});

describe('quickPromptsFor', () => {
  it('customers see ordering prompts, merchants see dashboard prompts', () => {
    const customer = quickPromptsFor('customer').map((p) => p.label);
    const merchant = quickPromptsFor('owner').map((p) => p.label);
    expect(customer).toContain('أطلب إزاي؟');
    expect(customer).not.toContain('أضيف منتج');
    expect(merchant).toContain('أضيف منتج');
    expect(merchant).not.toContain('أطلب إزاي؟');
  });
});

describe('demoReply', () => {
  it('answers customer questions in Egyptian Arabic', () => {
    const reply = demoReply('أطلب من محل إزاي؟', 'customer');
    expect(reply).toContain('السلة');
    expect(reply).not.toBe(FALLBACK_REPLY);
  });

  it('normalizes Arabic before matching (أ/إ/ة/ى variants)', () => {
    expect(demoReply('إزاي أتابع طلبي', 'customer')).toBe(demoReply('ازاي اتابع طلبي', 'customer'));
  });

  it('merchant answers are gated: a customer asking about adding a product gets the fallback', () => {
    expect(demoReply('أضيف منتج لمحلي إزاي؟', 'customer')).toBe(FALLBACK_REPLY);
    expect(demoReply('أضيف منتج لمحلي إزاي؟', 'owner')).not.toBe(FALLBACK_REPLY);
  });

  it('shared topics (delivery fees) answer for everyone', () => {
    expect(demoReply('رسوم التوصيل كام؟', 'customer')).not.toBe(FALLBACK_REPLY);
    expect(demoReply('رسوم التوصيل كام؟', 'owner')).not.toBe(FALLBACK_REPLY);
  });

  it('is honest about points (not fully active yet — no fake loyalty promises)', () => {
    const reply = demoReply('النقاط بتشتغل إزاي؟', 'customer');
    expect(reply).toContain('لسه');
  });

  it('unknown questions get the honest fallback, never an invented answer', () => {
    const reply = demoReply('إيه رأيك في ماتش الأهلي إمبارح؟', 'customer');
    expect(reply).toBe(FALLBACK_REPLY);
    expect(reply).toContain('مش عندي إجابته');
  });

  it('never leaks phone numbers or prices it cannot verify', () => {
    for (const q of ['رسوم التوصيل كام؟', 'أطلب إزاي؟', 'عايز رقم الدعم']) {
      const reply = demoReply(q, 'customer');
      expect(reply).not.toMatch(/\d{6,}/);
    }
  });
});

describe('greetingFor', () => {
  it('differs per audience and names what it can help with', () => {
    expect(greetingFor('customer')).toContain('الطلب');
    expect(greetingFor('owner')).toContain('لوحة التحكم');
    expect(greetingFor('customer')).not.toBe(greetingFor('owner'));
  });
});
