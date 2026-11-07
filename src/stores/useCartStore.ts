import {isSupabaseConfigured} from '@/repositories/supabaseClient';
import { create } from 'zustand';
import { imageForService } from '@/config/serviceImages';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Service, Shop } from '@/types';
import { formatCurrency as formatPrice } from '@/utils/helpers';

// One order at a time: the cart holds one service, or products from one
// shop/restaurant. Adding from somewhere else asks to empty it first.

const MAX_QUANTITY = 100;

export type AddResult =
  | { status: 'added' }
  /** The cart holds another service or shop; nothing was added. */
  | { status: 'other_vendor'; current: string };

interface CartStore {
  items: CartItem[];
  cartWiggle: boolean;
  /** The service or shop the cart is for, or null when empty. */
  getVendor: () => { key: string; name: string } | null;
  /** Adds unless the cart holds another service or shop; `replace` empties it first. */
  addItem: (item: CartItem, replace?: boolean) => AddResult;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalCount: () => number;
}

function vendorOf(item: CartItem): { key: string; name: string } {
  return item.vendor ?? { key: `service:${item.serviceId}`, name: item.name };
}

/** A service as one cart line (no quantity box unless the service has a unit). */
export function cartItemFromService(service: Service): CartItem {
  const price = service.numericPrice ?? 0;
  return {
    id: `service-${service.id}`,
    serviceId: service.id,
    photo: imageForService(service),
    name: service.name,
    price,
    formattedPrice: service.numericPrice != null ? formatPrice(service.numericPrice) : service.price,
    priceType: service.numericPrice != null ? service.priceType : 'quote',
    emoji: service.emoji,
    quantity: service.quantity?.min ?? 1,
    unit: service.quantity?.unit,
    step: service.quantity?.step,
    vendor: { key: `service:${service.id}`, name: service.name },
  };
}

/** A product from a shop or restaurant; `grill` adds the grilling price per kilo. */
export function cartItemFromProduct(
  shop: Shop,
  product: Product,
  grill?: { pricePerKilo: number },
): CartItem {
  const price = product.price + (grill?.pricePerKilo ?? 0);
  return {
    id: `shop-${shop.id}-${product.id}${grill ? '-grill' : ''}`,
    demoOnly:shop.demo===true||product.demo===true||!isSupabaseConfigured,
    originalPrice:product.originalPrice!=null?product.originalPrice+(grill?.pricePerKilo??0):undefined,
    offerId:product.offerId,offerEndsAt:product.offerEndsAt,offerPercent:product.offerPercent,
    serviceId: 0,
    name: grill ? `${product.name} (شراء وشوي)` : product.name,
    price,
    formattedPrice: `${formatPrice(price)} / ${product.unit}`,
    priceType: 'fixed',
    emoji: product.emoji,
    photo: product.photo || shop.photo,
    quantity: product.step < 1 ? 1 : product.step,
    unit: product.unit,
    step: product.step,
    vendor: { key: `shop:${shop.id}`, name: shop.name },
    shopId: shop.id,
    productId: product.id,
    grill: grill ? true : undefined,
  };
}

function roundToStep(quantity: number, step: number): number {
  return Math.round(quantity / step) * step;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartWiggle: false,

      getVendor: () => {
        const first = get().items[0];
        return first ? vendorOf(first) : null;
      },

      addItem: (newItem, replace = false) => {
        const current = get().getVendor();
        if (current && current.key !== vendorOf(newItem).key && !replace) {
          return { status: 'other_vendor', current: current.name };
        }
        set((state) => {
          const items = current && current.key !== vendorOf(newItem).key ? [] : state.items;
          const existing = items.find((item) => item.id === newItem.id);
          // A service without a unit is ordered once: adding it again changes nothing
          const next = existing
            ? items.map((item) =>
                item.id === newItem.id && item.unit
                  ? { ...item, quantity: Math.min(item.quantity + (item.step ?? 1), MAX_QUANTITY) }
                  : item,
              )
            : [...items, newItem];
          return { items: next, cartWiggle: true };
        });
        setTimeout(() => set({ cartWiggle: false }), 500);
        return { status: 'added' };
      },

      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.id !== id) return [item];
            if (!item.unit) return [item];
            const step = item.step ?? 1;
            const next = Math.min(roundToStep(quantity, step), MAX_QUANTITY);
            return next < step ? [] : [{ ...item, quantity: next }];
          }),
        })),

      clearCart: () => set({ items: [] }),

      getTotalAmount: () =>
        Math.round(get().items.reduce((total, item) => total + item.price * item.quantity, 0) * 100) / 100,

      // Kilos count as one line each in the badge
      getTotalCount: () =>
        get().items.reduce((count, item) => count + (item.unit && item.step === 1 ? item.quantity : 1), 0),
    }),
    {
      name: 'qaryati_cart_storage',
      version: 2,
      // v1 carts could mix several services; start fresh rather than guess which to keep
      migrate: () => ({ items: [], cartWiggle: false }),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
