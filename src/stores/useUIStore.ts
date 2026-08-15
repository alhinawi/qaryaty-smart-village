// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveTab, AppNotification, Order } from '@/types';

// ─── Initial Notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'طلبك وصل!',
    message: 'تم تسليم طلب عيش من الفرن بنجاح.',
    time: 'منذ 15 دقيقة',
    read: false,
    type: 'order',
    icon: '🥖',
  },
  {
    id: 'notif_2',
    title: 'المزود في الطريق',
    message: 'الكابتن محمد في الطريق إليك ومعه طلب السباكة.',
    time: 'منذ ساعة',
    read: false,
    type: 'order',
    icon: '🛵',
  },
  {
    id: 'notif_3',
    title: 'عرض ترويجي جديد 🎉',
    message: 'استخدم كود QARYA1 واحصل على أول توصيل مجاناً!',
    time: 'اليوم',
    read: true,
    type: 'promo',
    icon: '🎁',
  },
];

// ─── State Interface
interface UIState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  searchHistory: string[];
  addSearchHistory: (term: string) => void;
  removeSearchHistoryItem: (term: string) => void;
  clearSearchHistory: () => void;

  notifications: AppNotification[];
  addNotification: (
    notif: Omit<AppNotification, 'id' | 'time' | 'read'>
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;

  isRatingModalOpen: boolean;
  ratingOrder: Order | null;
  openRatingModal: (order: Order) => void;
  closeRatingModal: () => void;

  toastMessage: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Store
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      searchHistory: ['عيش', 'شوي سمك', 'سباك', 'سوبر ماركت'],
      addSearchHistory: (term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        const current = get().searchHistory.filter((item) => item !== trimmed);
        set({ searchHistory: [trimmed, ...current].slice(0, 5) });
      },
      removeSearchHistoryItem: (term: string) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter((item) => item !== term),
        }));
      },
      clearSearchHistory: () => set({ searchHistory: [] }),

      notifications: INITIAL_NOTIFICATIONS,
      addNotification: (notif) => {
        const newNotif: AppNotification = {
          ...notif,
          id: `notif_${Date.now()}`,
          time: 'الآن',
          read: false,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
        get().showToast(`🔔 ${notif.title}: ${notif.message}`);
      },
      markNotificationAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      isCartOpen: false,
      setIsCartOpen: (open) => set({ isCartOpen: open }),

      isNotificationsOpen: false,
      setIsNotificationsOpen: (open) => set({ isNotificationsOpen: open }),

      isRatingModalOpen: false,
      ratingOrder: null,
      openRatingModal: (order) =>
        set({ isRatingModalOpen: true, ratingOrder: order }),
      closeRatingModal: () =>
        set({ isRatingModalOpen: false, ratingOrder: null }),

      toastMessage: null,
      showToast: (message: string) => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toastMessage: message });
        toastTimer = setTimeout(() => {
          set({ toastMessage: null });
        }, 3000);
      },
      clearToast: () => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toastMessage: null });
      },
    }),
    {
      name: 'qaryati_ui_storage',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        notifications: state.notifications,
      }),
    }
  )
);
