// ─── Village view settings (this device)
// The village itself lives in the profile (profile.village); this keeps the "nearby" toggle
// and whether the user has picked their village yet.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VillageState {
  /** "اعرض القرى القريبة كمان" */
  includeNearby: boolean;
  /** The user picked a village (not just the default). */
  chosen: boolean;
  setIncludeNearby: (on: boolean) => void;
  markChosen: () => void;
}

export const useVillageStore = create<VillageState>()(
  persist(
    (set) => ({
      includeNearby: false,
      chosen: false,
      setIncludeNearby: (includeNearby) => set({ includeNearby }),
      markChosen: () => set({ chosen: true }),
    }),
    { name: 'qaryati_village' }
  )
);
