// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';

// ─── Initial Demo Profile
const INITIAL_PROFILE: UserProfile = {
  name: 'محمدالهناوي', 
  phone: '01012345678',
  address: 'شارع المدرسة، قرية البركة',
  village: 'قرية البركة - الجيزة',
  rewardPoints: 120,
  memberSince: 'يناير 2026',
};

// ─── State Interface
interface UserState {
  profile: UserProfile;
  favorites: number[]; // Service IDs
  toggleFavorite: (serviceId: number) => void;
  isFavorite: (serviceId: number) => boolean;
  addRewardPoints: (points: number) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

// ─── Store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: INITIAL_PROFILE,
      favorites: [1, 3, 13], // default initial favorites: bread, supermarket, home food

      toggleFavorite: (serviceId: number) => {
        const current = get().favorites;
        if (current.includes(serviceId)) {
          set({ favorites: current.filter((id) => id !== serviceId) });
        } else {
          set({ favorites: [...current, serviceId] });
        }
      },

      isFavorite: (serviceId: number) => {
        return get().favorites.includes(serviceId);
      },

      addRewardPoints: (points: number) => {
        set((state) => ({
          profile: {
            ...state.profile,
            rewardPoints: state.profile.rewardPoints + points,
          },
        }));
      },

      updateProfile: (data: Partial<UserProfile>) => {
        set((state) => ({
          profile: {
            ...state.profile,
            ...data,
          },
        }));
      },
    }),
    {
      name: 'qaryati_user_storage',
    }
  )
);
