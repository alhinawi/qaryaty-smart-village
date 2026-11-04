// ─── Orders repository
import type { Order } from '@/types';

export type NewOrder = Omit<Order, 'id' | 'createdAt'>;

export interface OrderRepo {
  /** Saves the order and returns it with its id. Throws if it was not saved. */
  createOrder(input: NewOrder): Promise<Order>;
}
