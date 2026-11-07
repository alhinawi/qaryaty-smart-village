// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '@/types';
import { isSupabaseConfigured, orderRepo } from '@/repositories';

// ─── Initial Demo Orders
export const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ord_demo_1',
    orderNumber: '#4821',
    serviceName: 'عيش من الفرن',
    serviceEmoji: '🥖',
    address: 'شارع الجامع الكبير، أمام المدرسة',
    phone: '01098765432',
    notes: 'عيش بلدي طازة لو سمحت',
    paymentMethod: 'cash',
    discountAmount: 0,
    totalAmount: 5,
    status: 'done',
    createdAt: 'اليوم، 10:30 ص',
    rating: 5,
    feedback: 'سريع وممتاز جداً!',
  },
  {
    id: 'ord_demo_2',
    orderNumber: '#3920',
    serviceName: 'سباك',
    serviceEmoji: '🔧',
    address: 'بجوار صيدلية الأمل',
    phone: '01123456789',
    paymentMethod: 'vodafone',
    discountAmount: 0,
    totalAmount: 50,
    status: 'onway',
    createdAt: 'اليوم، 11:15 ص',
  },
];

type SavedOrders = { orders: Order[]; activeOrder: Order | null };

/** Removes the sample orders (ids ord_demo_*) a device saved before the live site. */
export function dropDemoOrders(state: SavedOrders): SavedOrders {
  if (!state?.orders) return state;
  const isDemo = (o: Order | null) => Boolean(o?.id.startsWith('ord_demo_'));
  return {
    ...state,
    orders: state.orders.filter((o) => !isDemo(o)),
    activeOrder: isDemo(state.activeOrder) ? null : state.activeOrder,
  };
}

// ─── State Interface
interface OrderState {
  /** null is the guest; a cache is never shared across account boundaries. */
  ownerId: string | null;
  /** In-memory generation guards late order responses after logout/account changes. */
  scopeVersion: number;
  setOwner: (ownerId: string | null) => void;
  historyLoading: boolean;
  historyError: string | null;
  historyLoaded: boolean;
  historyHasMore: boolean;
  historyOffset: number;
  loadHistory: (more?: boolean) => Promise<void>;
  orders: Order[];
  activeOrder: Order | null;
  /** Adds an order the repository already saved (see createOrder in src/repositories). */
  addOrder: (order: Order, scopeVersion: number) => boolean;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  /** Returns false if the order doesn't exist or was already rated. */
  addRating: (orderId: string, rating: number, feedback?: string) => boolean;
  setActiveOrder: (order: Order | null) => void;
  deleteOrder: (orderId: string) => void;
}

// ─── Store
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      // The two sample orders are for demo mode only: a real customer starts with none
      orders: isSupabaseConfigured ? [] : INITIAL_DEMO_ORDERS,
      activeOrder: null,
      historyLoading: false,
      historyError: null,
      historyLoaded: false,
      historyHasMore: false,
      historyOffset: 0,
      ownerId: null,
      scopeVersion: 0,

      setOwner: (ownerId) => {
        if (get().ownerId === ownerId) return;
        set((state) => ({ ownerId, orders: [], activeOrder: null, scopeVersion: state.scopeVersion + 1,
          historyLoading: false, historyError: null, historyLoaded: false, historyHasMore: false, historyOffset: 0 }));
      },

      loadHistory: async (more = false) => {
        const { ownerId, scopeVersion, historyLoading, historyOffset } = get();
        if (!isSupabaseConfigured || !ownerId || historyLoading) return;
        const offset = more ? historyOffset : 0;
        const initialIds = new Set(get().orders.map(o => o.id));
        set({ historyLoading: true, historyError: null });
        try {
          const rows = await orderRepo.listMine(ownerId, offset);
          if (get().scopeVersion !== scopeVersion) return;
          set(state => {
            const preserved = more ? state.orders : state.orders.filter(o => o.id.startsWith('ord_demo_local_')||!initialIds.has(o.id));
            const byId = new Map(preserved.map(o => [o.id, o]));
            rows.forEach(o => byId.set(o.id, o));
            const orders = [...byId.values()];
            return { orders, activeOrder: orders.find(o => o.id === state.activeOrder?.id) ?? null,
              historyLoading: false, historyLoaded: true, historyHasMore: rows.length === 50,
              historyOffset: offset + rows.length };
          });
        } catch {
          if (get().scopeVersion !== scopeVersion) return;
          set({ historyLoading: false, historyError: 'مش قادرين نحمّل سجل حسابك دلوقتي. البيانات اللي ظاهرة ممكن تكون قديمة. جرّب تاني.' });
        }
      },

      addOrder: (order, scopeVersion) => {
        if (get().scopeVersion !== scopeVersion) return false;
        set((state) => ({
          orders: [order, ...state.orders.filter((o) => o.id !== order.id)],
          activeOrder: order,
        }));
        return true;
      },

      updateStatus: (orderId: string, status: OrderStatus) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
          activeOrder:
            state.activeOrder?.id === orderId
              ? { ...state.activeOrder, status }
              : state.activeOrder,
        }));
      },

      addRating: (orderId: string, rating: number, feedback?: string) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.rating) return false;
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, rating, feedback } : order
          ),
        }));
        return true;
      },

      setActiveOrder: (order: Order | null) => {
        set({ activeOrder: order });
      },

      deleteOrder: (orderId: string) => {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
          activeOrder:
            state.activeOrder?.id === orderId ? null : state.activeOrder,
        }));
      },
    }),
    {
      // Never read or rewrite the ownerless legacy key. Its exact bytes remain quarantined.
      name: 'qaryati_orders_scoped_v3',
      version: 3,
      merge: (persisted, current) => isSupabaseConfigured
        ? current
        : { ...current, ...(persisted as Partial<OrderState>) },
      // Live private orders stay in this tab only. Account history is fetched with RLS.
      // No owner can flash from disk before the current session is reconciled.
      partialize: ({ orders, activeOrder, ownerId }) => isSupabaseConfigured
        ? { orders: [], activeOrder: null, ownerId: null }
        : { orders, activeOrder, ownerId },
      // Unknown future/older scoped cache formats are not adopted. Legacy key is untouched.
      migrate: () => ({ orders: [], activeOrder: null, ownerId: null }),
    }
  )
);
