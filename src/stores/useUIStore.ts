// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rememberSearch } from '@/utils/recentSearches';
import type { AppNotification, Order } from '@/types';

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
    message: 'استخدم كود QARYA1 وأول طلب ليك هيبقى من غير رسوم، يعني من غير عمولة التطبيق.',
    time: 'اليوم',
    read: true,
    type: 'promo',
    icon: '🎁',
  },
];

// ─── State Interface
interface UIState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  /** The full-screen search (opened from the header's search bar). */
  isSearchOpen: boolean;
  /** True once the search screen was opened, so its code stays loaded. */
  searchMounted: boolean;
  setIsSearchOpen: (open: boolean) => void;

  searchHistory: string[];
  addSearchHistory: (term: string) => void;
  removeSearchHistoryItem: (term: string) => void;
  clearSearchHistory: () => void;

  notifications: AppNotification[];
  /** Server notifications (order updates…). Merged over the samples: every real one replaces a sample. */
  remoteNotifications: AppNotification[];
  setRemoteNotifications: (list: AppNotification[]) => void;
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

const SEEDED_HISTORY = ['عيش', 'شوي سمك', 'سباك', 'سوبر ماركت'];
export const isSeededHistory = (history: unknown): boolean =>
  Array.isArray(history) &&
  history.length === SEEDED_HISTORY.length &&
  history.every((item, i) => item === SEEDED_HISTORY[i]);

let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Store
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      isSearchOpen: false,
      searchMounted: false,
      setIsSearchOpen: (open) =>
        set(open ? { isSearchOpen: true, searchMounted: true } : { isSearchOpen: false }),

      // Only what this person searched for, on this device
      searchHistory: [],
      addSearchHistory: (term: string) => {
        set({ searchHistory: rememberSearch(get().searchHistory, term) });
      },
      removeSearchHistoryItem: (term: string) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter((item) => item !== term),
        }));
      },
      clearSearchHistory: () => set({ searchHistory: [] }),

      notifications: INITIAL_NOTIFICATIONS,
      remoteNotifications: [],
      setRemoteNotifications: (list) => set({ remoteNotifications: list }),
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
          remoteNotifications: state.remoteNotifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          remoteNotifications: state.remoteNotifications.map((n) => ({ ...n, read: true })),
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
      version: 1,
      // v0 started everyone with made-up recent searches; drop them if they were never changed
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as { searchHistory?: unknown };
        if (version < 1 && isSeededHistory(state.searchHistory)) state.searchHistory = [];
        return state as UIState;
      },
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        notifications: state.notifications,
      }),
    }
  )
);

/** What the drawer and the bell badge show: real server notifications first,
 *  and every real one replaces one of the sample notifications (they stay
 *  until enough real ones arrive — nothing is deleted up front).
 *  A pure helper, not a store selector: components merge with useMemo, since a
 *  selector returning a fresh array loops React's snapshot check forever. */
export function mergeNotifications(remote: AppNotification[], local: AppNotification[]): AppNotification[] {
  return [...remote, ...local.slice(remote.length)];
}
