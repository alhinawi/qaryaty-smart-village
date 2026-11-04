// ─── Imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, UserProfile } from '@/types';

// ─── Guest Profile (nobody signed in)
export const GUEST_PROFILE: UserProfile = {
  name: 'ضيف',
  phone: '',
  address: '',
  village: 'قرية البركة - الجيزة',
  rewardPoints: 0,
  memberSince: '',
};

function memberSinceFrom(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(date);
}

// ─── State Interface
interface UserState {
  profile: UserProfile;
  favorites: number[]; // Service IDs
  /** Single-use promo codes this device already redeemed (client-side guard only). */
  usedPromoCodes: string[];
  markPromoUsed: (code: string) => void;
  toggleFavorite: (serviceId: number) => void;
  isFavorite: (serviceId: number) => boolean;
  addRewardPoints: (points: number) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  /** Fill the profile from the signed-in account (keeps reward points). */
  applyAuthUser: (user: AuthUser) => void;
  /** Back to the guest profile after logout. Favorites stay on the device. */
  resetToGuest: () => void;
}

// ─── Store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: GUEST_PROFILE,
      favorites: [1, 3, 13], // default initial favorites: bread, supermarket, home food
      usedPromoCodes: [],

      markPromoUsed: (code: string) => {
        const current = get().usedPromoCodes;
        if (!current.includes(code)) {
          set({ usedPromoCodes: [...current, code] });
        }
      },

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

      applyAuthUser: (user: AuthUser) => {
        set((state) => ({
          profile: {
            ...state.profile,
            name: user.name,
            phone: user.phone,
            address: user.address,
            village: user.village,
            memberSince: memberSinceFrom(user.createdAt),
          },
        }));
      },

      resetToGuest: () => {
        set({ profile: GUEST_PROFILE });
      },
    }),
    {
      name: 'qaryati_user_storage',
    }
  )
);
