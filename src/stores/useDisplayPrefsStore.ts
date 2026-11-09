import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** How the out-of-stock badge looks on product photos. Owner picks from لوحة التحكم. */
export type OosBadgeStyle = 'dim' | 'ribbon';

interface DisplayPrefsState {
  oosBadgeStyle: OosBadgeStyle;
  setOosBadgeStyle: (style: OosBadgeStyle) => void;
}

/**
 * Display preferences. Local fallback for the owner's control-panel choices;
 * the shared-DB path (so every device follows the owner's pick) is proposed in
 * supabase/migrations/20261108040000_app_settings.sql and waits for his OK.
 */
export const useDisplayPrefsStore = create<DisplayPrefsState>()(
  persist(
    (set) => ({
      oosBadgeStyle: 'dim',
      setOosBadgeStyle: (style) => set({ oosBadgeStyle: style }),
    }),
    { name: 'qaryati_display_prefs' }
  )
);
