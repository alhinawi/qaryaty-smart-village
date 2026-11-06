// ─── Demo orders: kept on this device only (useOrderStore persists them)
import { getFormattedDate } from '@/utils/helpers';
import { DELIVERY_FEE_DEFAULT } from '@/config/delivery';
import type { OrderRepo } from './types';

export function createMockOrderRepo(): OrderRepo {
  return {
    async createOrder(input) {
      return { ...input, id: `ord_${Date.now()}`, createdAt: getFormattedDate() };
    },
    async quoteDeliveryFee() {
      return DELIVERY_FEE_DEFAULT;
    },
  };
}
