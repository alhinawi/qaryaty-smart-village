// ─── Imports
import { useOrderStore } from '@/stores/useOrderStore';

// ─── useOrders Hook
export function useOrders() {
  const orders = useOrderStore((state) => state.orders);
  const activeOrder = useOrderStore((state) => state.activeOrder);
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const updateStatus = useOrderStore((state) => state.updateStatus);
  const addRating = useOrderStore((state) => state.addRating);
  const setActiveOrder = useOrderStore((state) => state.setActiveOrder);
  const deleteOrder = useOrderStore((state) => state.deleteOrder);

  return {
    orders,
    activeOrder,
    placeOrder,
    updateStatus,
    addRating,
    setActiveOrder,
    deleteOrder,
  };
}
