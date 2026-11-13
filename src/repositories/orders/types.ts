// ─── Orders repository
import type { Order } from '@/types';

export type NewOrder = Omit<Order, 'id' | 'createdAt'> & {
  /**
   * With a coupon: the order before it (the price plus the full commission, and
   * that commission). The database works the coupon out again from these; the
   * order's own totalAmount and commissionAmount are what the customer sees.
   */
  couponBase?: { totalAmount: number | null; commissionAmount: number };
  /** What the coupon took off (demo mode prices with it; Supabase ignores it). */
  couponEffect?: { itemsOff: number; commissionOff: number; deliveryOff: number };
};

export interface OrderRepo {
  /** Account-owned server history. Throws on auth mismatch or outage; never sample data. */
  listMine(ownerId: string, offset?: number): Promise<Order[]>;
  /** Saves the order and returns it with its id. Throws if it was not saved. */
  createOrder(input: NewOrder): Promise<Order>;
  /**
   * رسوم التوصيل for a cart order from this shop by the signed-in customer (or a
   * guest): the server's own number, the same one the order trigger charges.
   */
  quoteDeliveryFee(shopId: number): Promise<number>;
}
