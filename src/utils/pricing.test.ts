import { describe, expect, it } from 'vitest';
import type { CartItem, Order } from '@/types';
import {
  FIRST_ORDER_PROMO,
  checkPromoCode,
  describeTotal,
  getCartPricing,
  getOrderPricing,
} from './pricing';

const order = (id: string): Order => ({
  id,
  orderNumber: '#1',
  serviceName: 'x',
  serviceEmoji: 'x',
  address: 'x',
  phone: '01012345678',
  paymentMethod: 'cash',
  discountAmount: 0,
  totalAmount: 10,
  status: 'done',
  createdAt: new Date().toISOString(),
});

const item = (price: number, quantity: number, priceType?: CartItem['priceType']): CartItem => ({
  id: `c${price}${quantity}${priceType}`,
  serviceId: 1,
  name: 'x',
  price,
  formattedPrice: '',
  priceType,
  emoji: 'x',
  quantity,
});

describe('getOrderPricing (single service total)', () => {
  it('fixed price, no promo', () => {
    const p = getOrderPricing({ numericPrice: 15, priceType: 'fixed' }, false);
    expect(p).toMatchObject({ basePrice: 15, discountAmount: 0, finalPrice: 15, isEstimate: false });
  });

  it('fixed price with promo is free', () => {
    const p = getOrderPricing({ numericPrice: 15, priceType: 'fixed' }, true);
    expect(p.finalPrice).toBe(0);
    expect(p.discountAmount).toBe(15);
  });

  it('starting price is an estimate and is not discounted', () => {
    const p = getOrderPricing({ numericPrice: 80, priceType: 'from' }, true);
    expect(p).toMatchObject({ finalPrice: 80, discountAmount: 0, isEstimate: true });
  });

  it('no price means set after confirmation, never a made-up amount', () => {
    for (const numericPrice of [null, undefined, 0]) {
      const p = getOrderPricing({ numericPrice, priceType: 'fixed' }, true);
      expect(p.priceType).toBe('quote');
      expect(p.finalPrice).toBeNull();
    }
  });
});

describe('getCartPricing (cart total)', () => {
  it('sums quantities and discounts fixed items only', () => {
    const items = [item(10, 2, 'fixed'), item(80, 1, 'from'), item(0, 1, 'quote')];
    expect(getCartPricing(items, false)).toMatchObject({
      subtotal: 100,
      discountableAmount: 20,
      total: 100,
      isEstimate: true,
      hasQuoteItems: true,
    });
    expect(getCartPricing(items, true)).toMatchObject({ discountAmount: 20, total: 80 });
  });

  it('treats old cart items without priceType by their price', () => {
    expect(getCartPricing([item(5, 3)], false)).toMatchObject({ total: 15, isEstimate: false });
  });

  it('empty cart totals zero', () => {
    expect(getCartPricing([], true).total).toBe(0);
  });
});

describe('describeTotal', () => {
  const fmt = (n: number) => `${n} ج`;
  it('labels each price type', () => {
    expect(describeTotal(null, false, fmt)).toBe('السعر يتحدد بعد التأكيد');
    expect(describeTotal(80, true, fmt)).toBe('من 80 ج');
    expect(describeTotal(15, false, fmt)).toBe('15 ج');
  });
});

describe('checkPromoCode', () => {
  const ctx = { orders: [order('ord_demo_1')], usedPromoCodes: [], discountableAmount: 15 };

  it(`accepts ${FIRST_ORDER_PROMO} on a first order, any case and spacing`, () => {
    expect(checkPromoCode(' qarya1 ', ctx)).toEqual({ ok: true, code: FIRST_ORDER_PROMO });
  });

  it('rejects empty and unknown codes', () => {
    expect(checkPromoCode('', ctx).ok).toBe(false);
    expect(checkPromoCode('FREE', ctx).ok).toBe(false);
  });

  it('rejects a second use on this device', () => {
    expect(checkPromoCode(FIRST_ORDER_PROMO, { ...ctx, usedPromoCodes: [FIRST_ORDER_PROMO] }).ok).toBe(false);
  });

  it('rejects once the user has a real order', () => {
    expect(checkPromoCode(FIRST_ORDER_PROMO, { ...ctx, orders: [order('ord_123')] }).ok).toBe(false);
  });

  it('rejects when nothing has a fixed price', () => {
    expect(checkPromoCode(FIRST_ORDER_PROMO, { ...ctx, discountableAmount: 0 }).ok).toBe(false);
  });
});
