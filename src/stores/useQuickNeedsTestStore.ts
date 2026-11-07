// ─── «محتاج دلوقتي» staff test switch (device-local on purpose)
// The card opens itself for everyone inside the night window
// (isQuickNeedsNight); this lets a staff member preview it at any hour from
// the admin panel. It is a preview, not a site setting, so it stays on the
// device and never writes to app_settings.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuickNeedsTestState {
  testMode: boolean;
  setTestMode: (on: boolean) => void;
}

export const useQuickNeedsTestStore = create<QuickNeedsTestState>()(
  persist(
    (set) => ({
      testMode: false,
      setTestMode: (on) => set({ testMode: on }),
    }),
    { name: 'qaryati_quick_needs_test' },
  ),
);
