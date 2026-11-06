import { readFileSync } from 'node:fs';
import { DELIVERY_FEE_DEFAULT } from '@/config/delivery';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CartItem } from '@/types';
import {
  APP_COMMISSION_LABEL,
  APP_COMMISSION_MAX,
  APP_COMMISSION_MIN,
  APP_COMMISSION_PERCENT,
} from '@/config/commission';
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

const on = (payable: number | null, extra: Partial<{ isEstimate: boolean }> = {}) =>
  appCommission({ payable, isEstimate: false, ...extra });

describe('عمولة التطبيق settings', () => {
  it('is 5% of the order, at least 1 EGP and at most 50 EGP', () => {
    expect(APP_COMMISSION_PERCENT).toBe(5);
    expect(APP_COMMISSION_MIN).toBe(1);
    expect(APP_COMMISSION_MAX).toBe(50);
    expect(APP_COMMISSION_LABEL).toBe('عمولة التطبيق (5%)');
  });

  it('matches the server: the three functions in supabase/schema.sql', () => {
    const sql = readFileSync(path.resolve(__dirname, '../../supabase/schema.sql'), 'utf8');
    const value = (name: string) => {
      const match = sql.match(new RegExp(`function public\\.${name}\\(\\)[^$]*\\$\\$\\s*select\\s+([\\d.]+)::numeric`));
      expect(match?.[1], name).toBeDefined();
      return Number(match?.[1]);
    };
    expect(value('app_commission_percent')).toBe(APP_COMMISSION_PERCENT);
    expect(value('app_commission_min')).toBe(APP_COMMISSION_MIN);
    expect(value('app_commission_max')).toBe(APP_COMMISSION_MAX);
    // The old fixed fee is gone from the server
    expect(sql).not.toMatch(/create or replace function public\.app_commission\(\)/);
  });

  it('the server waives only the fee for QARYA1, never the price', () => {
    const sql = readFileSync(path.resolve(__dirname, '../../supabase/schema.sql'), 'utf8');
    expect(sql).toContain("new.commission_amount := case when new.discount_code = 'QARYA1' then 0 else fee end;");
    expect(sql).toContain("new.discount_amount := case when new.discount_code = 'QARYA1' then fee else 0 end;");
    expect(sql).toContain('new.total_amount := subtotal + new.commission_amount + new.delivery_fee;');
    expect(sql).not.toMatch(/then subtotal else 0 end/);
  });
});

describe('رسوم التوصيل on the server', () => {
  const migration = readFileSync(
    path.resolve(__dirname, '../../supabase/migrations/20261106210000_delivery_fee.sql'),
    'utf8'
  );
  const schema = readFileSync(path.resolve(__dirname, '../../supabase/schema.sql'), 'utf8');

  it('the default fee in the database is the app default', () => {
    const match = migration.match(/values \('delivery_fee_default', ([\d.]+)\)/);
    expect(Number(match?.[1])).toBe(DELIVERY_FEE_DEFAULT);
  });

  it('shop orders get the server fee on top; QARYA1 and the commission leave it alone', () => {
    for (const sql of [migration, schema]) {
      expect(sql).toContain('new.delivery_fee := public.delivery_fee_quote(new.shop_id);');
      expect(sql).toContain('new.total_amount := subtotal + new.commission_amount + new.delivery_fee;');
      // The commission is worked out on the items only
      expect(sql).toContain('fee := public.order_commission(new.discount_code, subtotal, false);');
    }
  });

  it('service orders never get one (the gas cylinder keeps its own fee in the price)', () => {
    for (const sql of [migration, schema]) {
      expect(sql).toContain('new.delivery_fee := 0;');
    }
    expect(migration).toContain('check (delivery_fee >= 0 and (delivery_fee = 0 or shop_id is not null))');
  });
});

describe('عمولة التطبيق as a percentage', () => {
  it('is 5% of what the order costs', () => {
    expect(on(100)).toBe(5);
    expect(on(200)).toBe(10);
    expect(on(260)).toBe(13);
    expect(on(500)).toBe(25);
  });

  it('rounds to the nearest whole pound, halves up', () => {
    expect(on(255)).toBe(13); // 12.75
    expect(on(245)).toBe(12); // 12.25
    expect(on(250)).toBe(13); // 12.5
    expect(on(30)).toBe(2); // 1.5
    expect(on(129.9)).toBe(6); // 6.495
    expect(on(0.1 + 0.2 + 49.7)).toBe(3); // 50 with float noise: 2.5 → 3
  });

  it('never goes under 1 EGP on an order with something to pay', () => {
    expect(on(5)).toBe(1); // 0.25
    expect(on(15)).toBe(1); // 0.75
    expect(on(0.5)).toBe(1);
  });

  it('never goes over 50 EGP however big the order', () => {
    expect(on(1000)).toBe(50);
    expect(on(1010)).toBe(50);
    expect(on(25000)).toBe(50);
  });

  it('nothing to pay or no price yet: no commission', () => {
    expect(on(0)).toBe(0);
    expect(on(null)).toBe(0);
    expect(on(-10)).toBe(0);
    expect(on(Number.NaN)).toBe(0);
  });

  it('a starting price pays on the starting price', () => {
    expect(on(80, { isEstimate: true })).toBe(4);
  });
});

describe('single order with the commission', () => {
  it('adds 5% of a fixed price, apart from the service price', () => {
    const p = getOrderPricing({ numericPrice: 15, priceType: 'fixed' }, false);
    expect(p).toMatchObject({ basePrice: 15, finalPrice: 15, commission: 1, totalToPay: 16 });
    const q = getOrderPricing({ numericPrice: 300, priceType: 'fixed' }, false);
    expect(q).toMatchObject({ finalPrice: 300, commission: 15, totalToPay: 315 });
  });

  it('takes the percentage after the gas delivery fee and the quantity', () => {
    const p = getOrderPricing(
      { numericPrice: 120, priceType: 'fixed', deliveryFee: 15, quantity: { unit: 'أنبوبة', min: 1, max: 5, step: 1 } },
      false,
      { quantity: 2 }
    );
    expect(p).toMatchObject({ basePrice: 255, finalPrice: 255, commission: 13, totalToPay: 268 });
  });

  it('adds it to a starting price, still an estimate', () => {
    const p = getOrderPricing({ numericPrice: 80, priceType: 'from' }, false);
    expect(p).toMatchObject({ isEstimate: true, commission: 4, totalToPay: 84 });
  });

  it('a price set after confirmation has no total and no commission yet', () => {
    const p = getOrderPricing({ numericPrice: null, priceType: 'quote' }, false);
    expect(p).toMatchObject({ totalToPay: null, commission: 0 });
  });

  it('the first order pays the price in full and no commission', () => {
    const p = getOrderPricing({ numericPrice: 15, priceType: 'fixed' }, true);
    expect(p).toMatchObject({ finalPrice: 15, commission: 0, discountAmount: 1, totalToPay: 15 });
  });

  it('the first order waives the commission on the gas delivery too, not the delivery fee', () => {
    const p = getOrderPricing(
      { numericPrice: 120, priceType: 'fixed', deliveryFee: 15, quantity: { unit: 'أنبوبة', min: 1, max: 5, step: 1 } },
      true,
      { quantity: 2 }
    );
    expect(p).toMatchObject({ basePrice: 255, finalPrice: 255, commission: 0, discountAmount: 13, totalToPay: 255 });
  });
});

describe('cart with the commission', () => {
  it('takes the percentage once on the whole cart, not per item', () => {
    // 70 → 3.5 → 4 (per item it would be 1 + 2 + 1)
    const p = getCartPricing([item(10, 2, 'fixed'), item(30, 1, 'fixed'), item(5, 4, 'fixed')], false);
    expect(p).toMatchObject({ subtotal: 70, total: 70, commission: 4, totalToPay: 74 });
  });

  it('a big cart stops at 50 EGP', () => {
    const p = getCartPricing([item(400, 3, 'fixed')], false);
    expect(p).toMatchObject({ total: 1200, commission: 50, totalToPay: 1250 });
  });

  it('the first cart pays the items in full and no commission', () => {
    expect(getCartPricing([item(10, 2, 'fixed')], true)).toMatchObject({
      total: 20,
      commission: 0,
      discountAmount: 1,
      totalToPay: 20,
    });
  });

  it('the code on a big cart waives the capped commission', () => {
    const p = getCartPricing([item(400, 3, 'fixed')], true);
    expect(p).toMatchObject({ total: 1200, commission: 0, discountAmount: 50, totalToPay: 1200 });
  });

  it('the code on a cart with a starting price keeps the estimate, without the fee', () => {
    const p = getCartPricing([item(10, 2, 'fixed'), item(80, 1, 'from')], true);
    expect(p).toMatchObject({ total: 100, commission: 0, discountAmount: 5, totalToPay: 100, isEstimate: true });
  });

  it('a cart with no price yet has no total and no commission yet', () => {
    expect(getCartPricing([item(0, 1, 'quote')], false)).toMatchObject({ commission: 0, totalToPay: null });
  });
});

describe('showing and sending the commission', () => {
  const fmt = (n: number) => `${n} ج`;

  it('a price set after confirmation says the percentage comes on top', () => {
    expect(describeTotal(null, false, fmt, 5)).toBe('السعر يتحدد بعد التأكيد + عمولة 5%');
    expect(describeTotal(84, true, fmt, 5)).toBe('من 84 ج');
    expect(describeTotal(16, false, fmt, 5)).toBe('16 ج');
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
        totalAmount: 315,
        commissionAmount: 15,
        status: 'pending',
      },
      null
    );
    expect(row).toMatchObject({ total_amount: 315, commission_amount: 15 });
  });
});
