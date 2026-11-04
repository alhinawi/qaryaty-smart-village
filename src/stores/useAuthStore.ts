// ─── Auth store
// Holds the current session and talks only to `authService` (mocked for now,
// see src/services/auth.ts). Not real security until a backend exists.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, AuthUser } from '@/types';
import { authService } from '@/services/auth';
import type { LoginInput, RegisterInput } from '@/utils/validators';
import { useUserStore } from './useUserStore';

interface AuthState {
  session: AuthSession | null;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Re-read the user (role/blocked can change from the admin panel). */
  refresh: () => Promise<void>;
  updateUser: (data: Partial<Pick<AuthUser, 'name' | 'village' | 'address'>>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,

      login: async (input) => {
        const session = await authService.login(input);
        set({ session });
        useUserStore.getState().applyAuthUser(session.user);
        return session.user;
      },

      register: async ({ confirmPassword: _confirm, ...input }) => {
        const session = await authService.register(input);
        set({ session });
        useUserStore.getState().applyAuthUser(session.user);
        return session.user;
      },

      logout: async () => {
        const token = get().session?.token;
        set({ session: null });
        useUserStore.getState().resetToGuest();
        if (token) await authService.logout(token);
      },

      refresh: async () => {
        const session = get().session;
        if (!session) return;
        const user = await authService.getUser(session.user.id);
        if (!user || user.blocked) {
          await get().logout();
          return;
        }
        set({ session: { ...session, user } });
      },

      updateUser: async (data) => {
        const session = get().session;
        if (!session) return;
        const user = await authService.updateProfile(session.user.id, data);
        set({ session: { ...session, user } });
      },
    }),
    {
      name: 'qaryati_auth_session',
      partialize: (state) => ({ session: state.session }),
    }
  )
);

/** Selectors */
export const selectUser = (state: AuthState) => state.session?.user ?? null;
export const selectIsAdmin = (state: AuthState) => state.session?.user.role === 'admin';
