// ─── The coupon قسايمي sends to the cart or the order form ("استخدمها")
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CouponState {
  /** The code to put in the next coupon field the customer opens. */
  pendingCode: string | null;
  setPendingCode: (code: string | null) => void;
  /** Takes the waiting code (once), or null. */
  takePendingCode: () => string | null;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      pendingCode: null,
      setPendingCode: (code) => set({ pendingCode: code }),
      takePendingCode: () => {
        const code = get().pendingCode;
        if (code) set({ pendingCode: null });
        return code;
      },
    }),
    // This visit only: a coupon picked yesterday shouldn't jump into today's cart
    { name: 'qaryati_pending_coupon', storage: createJSONStorage(() => sessionStorage) }
  )
);
