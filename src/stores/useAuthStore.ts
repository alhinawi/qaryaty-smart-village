// ─── Auth store
// Holds the current session and talks only to `authRepo` (mock in demo mode,
// Supabase when configured; see src/repositories/index.ts).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, AuthUser } from '@/types';
import { AuthError, authRepo } from '@/repositories';
import type { LoginInput, RegisterInput } from '@/utils/validators';
import { useUserStore } from './useUserStore';

interface AuthState {
  session: AuthSession | null;
  login: (input: LoginInput) => Promise<AuthUser>;
  /** The new user, or the address the activation email went to. */
  register: (input: RegisterInput) => Promise<{ user: AuthUser } | { confirmEmail: string }>;
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
        const session = await authRepo.login(input);
        set({ session });
        useUserStore.getState().applyAuthUser(session.user);
        return session.user;
      },

      register: async ({ confirmPassword: _confirm, ...input }) => {
        const result = await authRepo.register(input);
        if (result.status === 'confirm_email') return { confirmEmail: result.email };
        set({ session: result.session });
        useUserStore.getState().applyAuthUser(result.session.user);
        return { user: result.session.user };
      },

      logout: async () => {
        const token = get().session?.token;
        set({ session: null });
        useUserStore.getState().resetToGuest();
        // Signed out on this device even if the server can't be reached
        if (token) await authRepo.logout(token).catch((error: unknown) => console.warn('[qaryati] logout', error));
      },

      refresh: async () => {
        const session = get().session;
        if (!session) return;
        let user;
        try {
          user = await authRepo.getUser(session.user.id);
        } catch (error) {
          // Backend down: keep the user signed in, check again next time
          if (error instanceof AuthError && error.code === 'unavailable') return;
          throw error;
        }
        if (!user || user.blocked) {
          await get().logout();
          return;
        }
        set({ session: { ...session, user } });
      },

      updateUser: async (data) => {
        const session = get().session;
        if (!session) return;
        const user = await authRepo.updateProfile(session.user.id, data);
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
