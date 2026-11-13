import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeArabic } from '../villages/types';
import {
  cairoDayStart,
  cairoOffsetMinutes,
  canCancel,
  deliveryFeeFor,
  newProductId,
  nextOrderStatus,
  orderFilterArgs,
  orderFromJson,
  overviewFromJson,
  parseDeliveryFee,
  pendingTotal,
  presetRange,
  priceText,
  productProblem,
  scopeForShop,
  userMatches,
} from './logic';
import { adminError, createSupabaseAdminRepo } from './supabaseAdminRepo';

describe('order status flow', () => {
  it('moves forward one step and stops at the end', () => {
    expect(nextOrderStatus('pending')).toBe('confirmed');
    expect(nextOrderStatus('confirmed')).toBe('onway');
    expect(nextOrderStatus('onway')).toBe('done');
    expect(nextOrderStatus('done')).toBeNull();
    expect(nextOrderStatus('cancelled')).toBeNull();
  });
  it('only open orders can be cancelled', () => {
    expect(canCancel('pending')).toBe(true);
    expect(canCancel('onway')).toBe(true);
    expect(canCancel('done')).toBe(false);
    expect(canCancel('cancelled')).toBe(false);
  });
});

describe('overviewFromJson', () => {
  it('reads the RPC result and fills missing parts with 0', () => {
    const o = overviewFromJson({
      today: { orders: 3, revenue: '250.5', commission: 12 },
      status_counts: { pending: 2, done: 1 },
      users: { total: 9, today: 1 },
      pending: { orders: 2, jobs: 1, donations: 4, market_hidden: 1, rides_hidden: 2 },
      promo: { orders: 5, fees_waived: 30 },
      villages_served: 1,
    });
    expect(o.today).toEqual({ orders: 3, revenue: 250.5, commission: 12 });
    expect(o.week).toEqual({ orders: 0, revenue: 0, commission: 0 });
    expect(o.statusCounts).toEqual({ pending: 2, confirmed: 0, onway: 0, done: 1, cancelled: 0 });
    expect(o.users.week).toBe(0);
    expect(o.promo).toEqual({ orders: 5, feesWaived: 30 });
    expect(o.pending.ridesHidden).toBe(2);
    expect(pendingTotal(o)).toBe(10);
  });
  it('survives an empty answer', () => {
    expect(pendingTotal(overviewFromJson(null))).toBe(0);
  });
});

describe('orderFromJson', () => {
  it('maps a row with customer fields and item quantities', () => {
    const o = orderFromJson({
      id: 'x',
      order_number: 'Q-1',
      status: 'onway',
      items: [{ name: 'رز', quantity: 2, price: 30, unit: 'كيلو' }, { product_id: 'p9', qty: 3 }],
      subtotal_amount: 60,
      delivery_fee: 10,
      commission_amount: 0,
      discount_amount: 6,
      discount_code: 'QARYA1',
      total_amount: 70,
      customer_name: 'محمد',
    });
    expect(o.status).toBe('onway');
    expect(o.items[0]).toMatchObject({ name: 'رز', quantity: 2, price: 30 });
    expect(o.items[1]).toMatchObject({ name: 'p9', quantity: 3 });
    expect(o.deliveryFee).toBe(10);
    expect(o.discountCode).toBe('QARYA1');
    expect(o.customerName).toBe('محمد');
  });
  it('keeps a quote order total as null and an unknown status as pending', () => {
    const o = orderFromJson({ id: 'y', status: 'weird', total_amount: null });
    expect(o.total).toBeNull();
    expect(o.status).toBe('pending');
    expect(o.deliveryFee).toBe(0);
  });
});

describe('dates in Cairo', () => {
  it('knows the winter offset', () => {
    expect(cairoOffsetMinutes(new Date('2026-01-15T12:00:00Z'))).toBe(120);
  });
  it('starts the Cairo day at local midnight', () => {
    // 23:30 UTC on Nov 6 is already Nov 7 in Cairo (UTC+2)
    expect(cairoDayStart(new Date('2026-11-06T23:30:00Z')).toISOString()).toBe('2026-11-06T22:00:00.000Z');
    expect(cairoDayStart(new Date('2026-11-06T10:00:00Z'), 6).toISOString()).toBe('2026-10-30T22:00:00.000Z');
  });
  it('turns presets into a from date, and «all» into nothing', () => {
    const now = new Date('2026-11-06T10:00:00Z');
    expect(presetRange('today', now)).toEqual({ from: '2026-11-05T22:00:00.000Z' });
    expect(presetRange('all', now)).toEqual({});
  });
});

describe('orderFilterArgs', () => {
  it('sends null for empty filters so the server skips them', () => {
    expect(orderFilterArgs({ status: '', village: '  ', search: ' Q-1 ' })).toEqual({
      p_status: null,
      p_from: null,
      p_to: null,
      p_village: null,
      p_search: 'Q-1',
      p_limit: 100,
    });
  });
});

describe('catalog helpers', () => {
  it('writes the price text the customer sees', () => {
    expect(priceText('fixed', 50)).toBe('50 جنيه');
    expect(priceText('from', 120)).toBe('من 120 جنيه');
    expect(priceText('quote', 50)).toBe('بالاتفاق');
    expect(priceText('fixed', null)).toBe('بالاتفاق');
  });
  it('checks a product before saving', () => {
    expect(productProblem({ name: 'رز', price: 30, unit: 'كيلو' })).toBe('');
    expect(productProblem({ name: 'ر', price: 30, unit: 'كيلو' })).not.toBe('');
    expect(productProblem({ name: 'رز', price: -1, unit: 'كيلو' })).not.toBe('');
    expect(productProblem({ name: 'رز', price: NaN, unit: 'كيلو' })).not.toBe('');
    expect(productProblem({ name: 'رز', price: 30, unit: ' ' })).not.toBe('');
  });
  it('makes a product id that is not taken', () => {
    const first = newProductId([], 1000);
    expect(newProductId([first], 1000)).toBe(`${first}-2`);
  });
  it('uses the same product list rule as the database', () => {
    expect(scopeForShop({ id: 4, kind: 'grocery' })).toBe('grocery');
    expect(scopeForShop({ id: 7, kind: 'restaurant' })).toBe('restaurant:7');
  });
});

describe('delivery fees', () => {
  it('parses what the admin types, Arabic digits too', () => {
    expect(parseDeliveryFee('15', false)).toEqual({ ok: true, value: 15 });
    expect(parseDeliveryFee('١٢', false)).toEqual({ ok: true, value: 12 });
    expect(parseDeliveryFee('7.5', false)).toEqual({ ok: true, value: 7.5 });
    expect(parseDeliveryFee('', true)).toEqual({ ok: true, value: null });
    expect(parseDeliveryFee('', false).ok).toBe(false);
    expect(parseDeliveryFee('-1', true).ok).toBe(false);
    expect(parseDeliveryFee('abc', true).ok).toBe(false);
    expect(parseDeliveryFee('5000', true).ok).toBe(false);
  });
  it('picks the shop fee or the default, raised to a farther village fee', () => {
    expect(deliveryFeeFor(10, null, null)).toBe(10);
    expect(deliveryFeeFor(10, 15, null)).toBe(15);
    expect(deliveryFeeFor(10, 15, 25)).toBe(25);
    expect(deliveryFeeFor(10, 0, 5)).toBe(5);
    expect(deliveryFeeFor(10, 20, 5)).toBe(20);
  });
});

describe('users search', () => {
  const u = { name: 'محمد الحناوي', username: 'alhinawi', phone: '01012345678', village: 'منية سندوب' };
  it('matches any field, ignoring ة/ه and case', () => {
    expect(userMatches(u, 'منيه', normalizeArabic)).toBe(true);
    expect(userMatches(u, 'ALHIN', normalizeArabic)).toBe(true);
    expect(userMatches(u, '0101', normalizeArabic)).toBe(true);
    expect(userMatches(u, 'تلبانة', normalizeArabic)).toBe(false);
    expect(userMatches(u, '  ', normalizeArabic)).toBe(true);
  });
});

describe('supabase admin repo', () => {
  it('turns a refused call into an Arabic «not admin» message', () => {
    expect(adminError({ code: '42501', message: 'admins only' }).message).toContain('مش أدمن');
    expect(adminError({ message: 'new row violates row-level security policy' }).message).toContain('مش أدمن');
  });

  it('calls the RPCs with the filter and maps rows', async () => {
    const rpc = vi.fn(async (name: string) =>
      name === 'admin_list_orders'
        ? { data: [{ id: 'a', order_number: 'Q-9', status: 'done' }], error: null }
        : { data: { today: { orders: 1 } }, error: null }
    );
    const repo = createSupabaseAdminRepo(async () => ({ rpc }) as unknown as SupabaseClient, 'https://x.supabase.co');
    const orders = await repo.listOrders({ status: 'done', search: 'Q-9' });
    expect(rpc).toHaveBeenCalledWith('admin_list_orders', expect.objectContaining({ p_status: 'done', p_search: 'Q-9' }));
    expect(orders[0].orderNumber).toBe('Q-9');
    expect((await repo.overview()).today.orders).toBe(1);
  });

  it('throws the server refusal instead of returning data', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { code: '42501', message: 'admins only' } }));
    const repo = createSupabaseAdminRepo(async () => ({ rpc }) as unknown as SupabaseClient, 'https://x.supabase.co');
    await expect(repo.overview()).rejects.toThrow('مش أدمن');
    await expect(repo.setOrderStatus('id', 'cancelled', 'مش بيرد')).rejects.toThrow();
    expect(rpc).toHaveBeenLastCalledWith('admin_set_order_status', { p_id: 'id', p_status: 'cancelled', p_reason: 'مش بيرد' });
  });

  it('saves an empty village fee as null and the default fee by upsert', async () => {
    const calls: Array<[string, string, unknown]> = [];
    const chain = (table: string) => {
      const q: Record<string, unknown> = {};
      for (const m of ['eq', 'select']) q[m] = () => q;
      q.update = (v: unknown) => (calls.push([table, 'update', v]), q);
      q.upsert = (v: unknown) => (calls.push([table, 'upsert', v]), q);
      q.single = async () => ({ data: { id: 1, key: 'delivery_fee_default' }, error: null });
      return q;
    };
    const repo = createSupabaseAdminRepo(
      async () => ({ from: chain }) as unknown as SupabaseClient,
      'https://x.supabase.co'
    );
    await repo.setVillageDeliveryFee(5, null);
    await repo.setDefaultDeliveryFee(12);
    expect(calls[0]).toEqual(['villages', 'update', { delivery_fee: null }]);
    expect(calls[1][0]).toBe('app_settings');
    expect(calls[1][2]).toMatchObject({ key: 'delivery_fee_default', value: 12 });
  });
});

describe('canUseManage', () => {
  it('opens /admin/manage for the owner and the general supervisor only', async () => {
    const { canUseManage } = await import('@/pages/AdminManage/tabs');
    expect(canUseManage('owner')).toBe(true);
    expect(canUseManage('admin')).toBe(true);
    for (const r of ['content_admin', 'orders_admin', 'customer', undefined, null]) expect(canUseManage(r)).toBe(false);
  });
});
