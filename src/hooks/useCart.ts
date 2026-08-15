// ─── Imports
import { useCartStore } from '@/stores/useCartStore';

// ─── useCart Hook
export function useCart() {
  const items = useCartStore((state) => state.items);
  const cartWiggle = useCartStore((state) => state.cartWiggle);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);
  const getTotalCount = useCartStore((state) => state.getTotalCount);

  return {
    items,
    cartWiggle,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalAmount: getTotalAmount(),
    totalCount: getTotalCount(),
  };
}
