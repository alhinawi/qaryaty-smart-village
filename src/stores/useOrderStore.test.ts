import { describe, expect, it } from 'vitest';
import type { Order } from '@/types';
import { dropDemoOrders } from './useOrderStore';

const order = (id: string) => ({ id }) as Order;

describe('dropDemoOrders', () => {
  it('keeps real orders and removes the sample ones', () => {
    const result = dropDemoOrders({ orders: [order('ord_demo_1'), order('ord_9'), order('ord_demo_2')], activeOrder: order('ord_demo_2') });
    expect(result.orders.map((o) => o.id)).toEqual(['ord_9']);
    expect(result.activeOrder).toBeNull();
  });

  it('leaves a real active order alone', () => {
    const active = order('ord_9');
    expect(dropDemoOrders({ orders: [active], activeOrder: active }).activeOrder).toBe(active);
  });
});
