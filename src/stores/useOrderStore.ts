// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '@/types';
import { getFormattedDate } from '@/utils/helpers';

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
  placeOrder: (
    newOrderData: Omit<Order, 'id' | 'createdAt'>
  ) => Order;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  addRating: (orderId: string, rating: number, feedback?: string) => void;
  setActiveOrder: (order: Order | null) => void;
  deleteOrder: (orderId: string) => void;
}

// ─── Store
export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: INITIAL_DEMO_ORDERS,
      activeOrder: null,

      placeOrder: (newOrderData) => {
        const order: Order = {
          ...newOrderData,
          id: `ord_${Date.now()}`,
          createdAt: getFormattedDate(),
        };

        set((state) => ({
          orders: [order, ...state.orders],
          activeOrder: order,
        }));

        return order;
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
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, rating, feedback } : order
          ),
        }));
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
