import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CartItem } from '@/types';
import { APP_COMMISSION } from '@/config/commission';
import { orderToRow } from '@/repositories/orders/supabaseOrderRepo';
import { appCommission, describeTotal, getCartPricing, getOrderPricing } from './pricing';

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

describe('عمولة التطبيق', () => {
  it('is 5 EGP', () => {
    expect(APP_COMMISSION).toBe(5);
  });

  it('matches the server: public.app_commission() in supabase/schema.sql', () => {
    const sql = readFileSync(path.resolve(__dirname, '../../supabase/schema.sql'), 'utf8');
    const match = sql.match(/function public\.app_commission\(\)[^$]*\$\$\s*select\s+([\d.]+)::numeric/);
    expect(match?.[1]).toBeDefined();
    expect(Number(match?.[1])).toBe(APP_COMMISSION);
  });

  it('every order pays it, a price set after confirmation and a starting price too', () => {
    expect(appCommission({ payable: 100, isEstimate: false, discounted: false })).toBe(APP_COMMISSION);
    expect(appCommission({ payable: null, isEstimate: false, discounted: false })).toBe(APP_COMMISSION);
    expect(appCommission({ payable: 80, isEstimate: true, discounted: false })).toBe(APP_COMMISSION);
  });

  it('an order the first-order code made free pays nothing', () => {
    expect(appCommission({ payable: 0, isEstimate: false, discounted: true })).toBe(0);
    // Discounted but still something to pay: the commission stays
    expect(appCommission({ payable: 80, isEstimate: true, discounted: true })).toBe(APP_COMMISSION);
  });
});

describe('single order with the commission', () => {
  it('adds it to a fixed price, apart from the service price', () => {
    const p = getOrderPricing({ numericPrice: 15, priceType: 'fixed' }, false);
    expect(p).toMatchObject({ basePrice: 15, finalPrice: 15, commission: 5, totalToPay: 20 });
  });

  it('adds it after the gas delivery fee and the quantity', () => {
    const p = getOrderPricing(
      { numericPrice: 120, priceType: 'fixed', deliveryFee: 15, quantity: { unit: 'أنبوبة', min: 1, max: 5, step: 1 } },
      false,
      { quantity: 2 }
    );
    expect(p).toMatchObject({ basePrice: 255, finalPrice: 255, commission: 5, totalToPay: 260 });
  });

  it('adds it to a starting price, still an estimate', () => {
    const p = getOrderPricing({ numericPrice: 80, priceType: 'from' }, false);
    expect(p).toMatchObject({ isEstimate: true, commission: 5, totalToPay: 85 });
  });

  it('a price set after confirmation keeps no total but still has the commission', () => {
    const p = getOrderPricing({ numericPrice: null, priceType: 'quote' }, false);
    expect(p).toMatchObject({ totalToPay: null, commission: 5 });
  });

  it('a free first order pays nothing at all', () => {
    const p = getOrderPricing({ numericPrice: 15, priceType: 'fixed' }, true);
    expect(p).toMatchObject({ finalPrice: 0, commission: 0, totalToPay: 0 });
  });
});

describe('cart with the commission', () => {
  it('adds it once per order, not per item', () => {
    const p = getCartPricing([item(10, 2, 'fixed'), item(30, 1, 'fixed'), item(5, 4, 'fixed')], false);
    expect(p).toMatchObject({ subtotal: 70, total: 70, commission: 5, totalToPay: 75 });
  });

  it('a free first cart pays nothing', () => {
    expect(getCartPricing([item(10, 2, 'fixed')], true)).toMatchObject({ total: 0, commission: 0, totalToPay: 0 });
  });

  it('the code on a cart with a starting price still pays the commission', () => {
    const p = getCartPricing([item(10, 2, 'fixed'), item(80, 1, 'from')], true);
    expect(p).toMatchObject({ total: 80, commission: 5, totalToPay: 85, isEstimate: true });
  });

  it('a cart with no price yet has no total', () => {
    expect(getCartPricing([item(0, 1, 'quote')], false)).toMatchObject({ commission: 5, totalToPay: null });
  });
});

describe('showing and sending the commission', () => {
  const fmt = (n: number) => `${n} ج`;

  it('a price set after confirmation says the commission comes on top', () => {
    expect(describeTotal(null, false, fmt, 5)).toBe('السعر يتحدد بعد التأكيد + 5 ج');
    expect(describeTotal(85, true, fmt, 5)).toBe('من 85 ج');
  });

  it('the order row carries the commission to the server', () => {
    const row = orderToRow(
      'x',
      {
        orderNumber: '#1',
        serviceName: 'x',
        serviceEmoji: 'x',
        address: 'شارع الجامع',
        phone: '01012345678',
        paymentMethod: 'cash',
        discountAmount: 0,
        totalAmount: 20,
        commissionAmount: 5,
        status: 'pending',
      },
      null
    );
    expect(row).toMatchObject({ total_amount: 20, commission_amount: 5 });
  });
});
