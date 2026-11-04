// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '@/types';

// ─── Initial Demo Orders
const INITIAL_DEMO_ORDERS: Order[] = [
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

// ─── State Interface
interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  /** Adds an order the repository already saved (see createOrder in src/repositories). */
  addOrder: (order: Order) => void;
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
      orders: INITIAL_DEMO_ORDERS,
      activeOrder: null,

      addOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders.filter((o) => o.id !== order.id)],
          activeOrder: order,
        }));
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
      name: 'qaryati_orders_storage',
    }
  )
);
