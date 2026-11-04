// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Service } from '@/types';

// ─── State Interface
interface CartState {
  items: CartItem[];
  cartWiggle: boolean;
  addItem: (service: Service) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  triggerWiggle: () => void;
  getTotalAmount: () => number;
  getTotalCount: () => number;
}

// ─── Store
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartWiggle: false,

      addItem: (service: Service) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (item) => item.serviceId === service.id
        );

        if (existingIndex > -1) {
          // Return new objects instead of mutating the persisted item in place
          set({
            items: currentItems.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: Math.min(item.quantity + 1, 100) }
                : item
            ),
          });
        } else {
          const newItem: CartItem = {
            id: `cart_${service.id}_${Date.now()}`,
            serviceId: service.id,
            name: service.name,
            price: service.numericPrice ?? 0,
            formattedPrice: service.price,
            priceType: service.priceType,
            emoji: service.emoji,
            quantity: 1,
          };
          set({ items: [...currentItems, newItem] });
        }

        get().triggerWiggle();
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.min(100, quantity) } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      triggerWiggle: () => {
        set({ cartWiggle: true });
        setTimeout(() => {
          set({ cartWiggle: false });
        }, 600);
      },

      getTotalAmount: () => {
        return get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
      },

      getTotalCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: 'qaryati_cart_storage',
    }
  )
);
