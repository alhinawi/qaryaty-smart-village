import { describe, expect, it } from 'vitest';
import {
  couponConditions,
  couponEffect,
  couponHeadline,
  couponProblem,
  couponStatus,
  draftProblem,
  emptyDraft,
  normalizeCouponCode,
  sortMyCoupons,
  type Coupon,
  type CouponUsage,
  type MyCoupon,
  type OrderMoney,
} from './coupons';
import { getCartPricing, getOrderPricing } from './pricing';
import type { CartItem } from '@/types';

const base: Coupon = {
  id: 1,
  code: 'TEST10',
  title: 'خصم تجربة',
  description: '',
  kind: 'percent',
  value: 10,
  maxDiscount: null,
  minOrder: 0,
  appliesTo: 'both',
  shopId: null,
  firstOrderOnly: false,
  perUserLimit: null,
  totalLimit: null,
  startsAt: null,
  endsAt: null,
  active: true,
  isPublic: true,
};
const coupon = (over: Partial<Coupon> = {}): Coupon => ({ ...base, ...over });

const QARYA1 = coupon({ code: 'QARYA1', kind: 'waive_fees', value: 0, firstOrderOnly: true, perUserLimit: 1 });

const shopOrder = (over: Partial<OrderMoney> = {}): OrderMoney => ({
  target: 'products',
  shopId: 7,
  items: 200,
  commission: 10,
  delivery: 15,
  ...over,
});
const serviceOrder = (over: Partial<OrderMoney> = {}): OrderMoney => ({
  target: 'services',
  shopId: null,
  items: 150,
  commission: 8,
  delivery: 0,
  ...over,
});
const fresh: CouponUsage = { signedIn: true, hasOrders: false, usedByMe: 0, soldOut: false };
const NOW = new Date('2026-11-06T14:00:00Z');

describe('couponEffect', () => {
  it('QARYA1 waives the commission only, never the price or delivery', () => {
    expect(couponEffect(QARYA1, shopOrder())).toEqual({ itemsOff: 0, commissionOff: 10, deliveryOff: 0, total: 10 });
  });

  it('percent comes off the items, rounded, and stops at the cap', () => {
    expect(couponEffect(coupon({ value: 15 }), shopOrder({ items: 133 })).itemsOff).toBe(20);
    expect(couponEffect(coupon({ value: 50, maxDiscount: 30 }), shopOrder()).itemsOff).toBe(30);
  });

  it('fixed never takes the price below zero', () => {
    expect(couponEffect(coupon({ kind: 'fixed', value: 50 }), shopOrder({ items: 30 })).itemsOff).toBe(30);
    expect(couponEffect(coupon({ kind: 'fixed', value: 50 }), shopOrder()).itemsOff).toBe(50);
  });

  it('free delivery waives the delivery fee, up to its cap', () => {
    const free = coupon({ kind: 'free_delivery', value: 0, appliesTo: 'products' });
    expect(couponEffect(free, shopOrder())).toEqual({ itemsOff: 0, commissionOff: 0, deliveryOff: 15, total: 15 });
    expect(couponEffect({ ...free, maxDiscount: 10 }, shopOrder()).deliveryOff).toBe(10);
  });

  it('a price coupon on a price set later takes nothing', () => {
    expect(couponEffect(coupon(), serviceOrder({ items: null })).total).toBe(0);
  });
});

describe('couponProblem', () => {
  it('accepts a coupon that meets every condition', () => {
    expect(couponProblem(coupon(), shopOrder(), fresh, NOW)).toBeNull();
  });

  it('turns down stopped, early and ended coupons', () => {
    expect(couponProblem(coupon({ active: false }), shopOrder(), fresh, NOW)).toBe('الكوبون ده متوقف دلوقتي');
    expect(couponProblem(coupon({ startsAt: '2026-11-10T00:00:00Z' }), shopOrder(), fresh, NOW)).toMatch(/لسه مابدأش/);
    expect(couponProblem(coupon({ endsAt: '2026-11-01T00:00:00Z' }), shopOrder(), fresh, NOW)).toBe('الكوبون ده خلصت مدته');
  });

  it('keeps products, services and one shop apart', () => {
    expect(couponProblem(coupon({ appliesTo: 'products' }), serviceOrder(), fresh, NOW)).toBe('الكوبون ده لطلبات المحلات بس');
    expect(couponProblem(coupon({ appliesTo: 'services' }), shopOrder(), fresh, NOW)).toBe('الكوبون ده للخدمات بس');
    const oneShop = coupon({ appliesTo: 'products', shopId: 3, shopName: 'فرن الحاج' });
    expect(couponProblem(oneShop, shopOrder(), fresh, NOW)).toBe('الكوبون ده لطلبات فرن الحاج بس');
    expect(couponProblem(oneShop, shopOrder({ shopId: 3 }), fresh, NOW)).toBeNull();
  });

  it('QARYA1 works once, on the first order, for a signed-in account', () => {
    expect(couponProblem(QARYA1, serviceOrder(), fresh, NOW)).toBeNull();
    expect(couponProblem(QARYA1, serviceOrder(), { ...fresh, signedIn: false }, NOW)).toMatch(/سجّل دخول/);
    expect(couponProblem(QARYA1, serviceOrder(), { ...fresh, hasOrders: true }, NOW)).toMatch(/لأول طلب بس/);
  });

  it('counts uses per account and in total', () => {
    const twice = coupon({ perUserLimit: 2 });
    expect(couponProblem(twice, shopOrder(), { ...fresh, usedByMe: 1 }, NOW)).toBeNull();
    expect(couponProblem(twice, shopOrder(), { ...fresh, usedByMe: 2 }, NOW)).toMatch(/2 مرات/);
    expect(couponProblem(coupon({ perUserLimit: 1 }), shopOrder(), { ...fresh, usedByMe: 1 }, NOW)).toBe(
      'إنت استخدمت الكوبون ده قبل كده'
    );
    expect(couponProblem(coupon({ totalLimit: 50 }), shopOrder(), { ...fresh, soldOut: true }, NOW)).toMatch(/خلص/);
  });

  it('needs the minimum order, a known price, and a delivery fee to waive', () => {
    expect(couponProblem(coupon({ minOrder: 250 }), shopOrder(), fresh, NOW)).toBe('الكوبون ده لطلب من 250 ج أو أكتر');
    expect(couponProblem(coupon({ minOrder: 200 }), shopOrder(), fresh, NOW)).toBeNull();
    expect(couponProblem(coupon(), serviceOrder({ items: null }), fresh, NOW)).toMatch(/بيتحدد بعد التأكيد/);
    const free = coupon({ kind: 'free_delivery', value: 0, appliesTo: 'products' });
    expect(couponProblem(free, shopOrder({ delivery: 0 }), fresh, NOW)).toBe('مفيش رسوم توصيل على الطلب ده');
  });

  it('lets a waive-fees coupon go on a price set after confirmation', () => {
    expect(couponProblem(QARYA1, serviceOrder({ items: null, commission: 0 }), fresh, NOW)).toBeNull();
  });
});

describe('pricing with a coupon', () => {
  const cart: CartItem[] = [
    { id: 'a', name: 'عيش', price: 100, quantity: 2, emoji: '🍞', priceType: 'fixed' } as CartItem,
  ];

  it('the legacy flag (true) still waives the commission only', () => {
    const p = getCartPricing(cart, true, 15);
    expect(p.commission).toBe(0);
    expect(p.total).toBe(200);
    expect(p.deliveryFee).toBe(15);
    expect(p.totalToPay).toBe(215);
    expect(p.discountAmount).toBe(p.fullCommission);
  });

  it('a percent coupon lowers the items but keeps the commission on the full price', () => {
    const none = getCartPricing(cart, null, 15);
    const p = getCartPricing(cart, coupon({ value: 10 }), 15);
    expect(p.itemsDiscount).toBe(20);
    expect(p.commission).toBe(none.commission);
    expect(p.totalToPay).toBe((none.totalToPay as number) - 20);
  });

  it('a free delivery coupon removes the delivery fee from the total', () => {
    const none = getCartPricing(cart, null, 15);
    const p = getCartPricing(cart, coupon({ kind: 'free_delivery', value: 0, appliesTo: 'products' }), 15);
    expect(p.deliveryFee).toBe(0);
    expect(p.deliveryDiscount).toBe(15);
    expect(p.totalToPay).toBe((none.totalToPay as number) - 15);
  });

  it('a fixed coupon on a service lowers the price, not the commission', () => {
    const data = { numericPrice: 150, priceType: 'fixed' as const };
    const none = getOrderPricing(data, null);
    const p = getOrderPricing(data, coupon({ kind: 'fixed', value: 40 }));
    expect(p.priceDiscount).toBe(40);
    expect(p.finalPrice).toBe(110);
    expect(p.commission).toBe(none.commission);
    expect(p.fullPrice).toBe(150);
  });
});

describe('قسايمي cards', () => {
  const mine = (over: Partial<MyCoupon>): MyCoupon => ({ ...base, usedByMe: 0, soldOut: false, hasOrders: false, ...over });

  it('says what the coupon gives and its conditions', () => {
    expect(couponHeadline(QARYA1)).toBe('من غير رسوم التطبيق');
    expect(couponHeadline(coupon({ value: 25 }))).toBe('خصم 25%');
    expect(couponHeadline(coupon({ kind: 'fixed', value: 30 }))).toBe('خصم 30 ج');
    expect(couponConditions(coupon({ maxDiscount: 50, minOrder: 100, perUserLimit: 1 }))).toEqual([
      'لحد 50 ج',
      'لطلب من 100 ج أو أكتر',
      'مرة واحدة لكل حساب',
    ]);
  });

  it('marks used, expired and sold-out coupons and sorts them last', () => {
    const used = mine({ id: 2, perUserLimit: 1, usedByMe: 1 });
    const ended = mine({ id: 3, endsAt: '2026-11-01T00:00:00Z' });
    const soon = mine({ id: 4, endsAt: '2026-11-08T00:00:00Z' });
    const open = mine({ id: 5 });
    expect(couponStatus(used, true, NOW)).toBe('used');
    expect(couponStatus(ended, true, NOW)).toBe('expired');
    expect(couponStatus(mine({ soldOut: true }), true, NOW)).toBe('sold_out');
    expect(couponStatus(mine({ ...QARYA1, hasOrders: true }), true, NOW)).toBe('used');
    expect(sortMyCoupons([ended, used, open, soon], true, NOW).map((c) => c.id)).toEqual([4, 5, 2, 3]);
  });
});

describe('admin form', () => {
  it('normalizes codes and checks the limits the table checks', () => {
    expect(normalizeCouponCode(' eid 25 ')).toBe('EID25');
    const ok = { ...emptyDraft(), code: 'EID25', title: 'خصم العيد' };
    expect(draftProblem(ok)).toBeNull();
    expect(draftProblem({ ...ok, code: 'E' })).toMatch(/الكود/);
    expect(draftProblem({ ...ok, value: 120 })).toMatch(/النسبة/);
    expect(draftProblem({ ...ok, kind: 'free_delivery', value: 0, appliesTo: 'both' })).toMatch(/المحلات/);
    expect(draftProblem({ ...ok, startsAt: '2026-11-10T00:00:00Z', endsAt: '2026-11-09T00:00:00Z' })).toMatch(/النهاية/);
  });
});
