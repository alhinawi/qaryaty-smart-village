// ─── Auth store
// Holds the current session and talks only to `authRepo` (mock in demo mode,
// Supabase when configured; see src/repositories/index.ts).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, AuthUser } from '@/types';
import { AuthError, authRepo, notificationsRepo, referralRepo, type CompleteProfileInput } from '@/repositories';
import { useUIStore } from './useUIStore';
import { clearStoredReferral, storedReferralCode } from '@/utils/referral';
import type { LoginInput, RegisterInput } from '@/utils/validators';
import { useUserStore } from './useUserStore';
import { useOrderStore } from './useOrderStore';
import { isStaffRole, canReviewContent, canManageProviders } from '@/config/staffTiers';

interface AuthState {
  session: AuthSession | null;
  login: (input: LoginInput) => Promise<AuthUser>;
  /** The new user, or the address the activation email went to. */
  register: (input: RegisterInput) => Promise<{ user: AuthUser } | { confirmEmail: string }>;
  logout: () => Promise<void>;
  /** Re-read the user (role/blocked can change from the admin panel). */
  refresh: () => Promise<void>;
  updateUser: (data: Partial<Pick<AuthUser, 'name' | 'village' | 'address'>>) => Promise<void>;
  /** Sets the account photo, or clears it with null. */
  setAvatar: (photo: Blob | null) => Promise<void>;
  /** Off to Google; `returnTo` is the page to open after coming back. */
  signInWithGoogle: (returnTo: string) => Promise<void>;
  /** Back from Google: pick up the session. The page to open next, saved before leaving. */
  finishGoogleSignIn: () => Promise<{ user: AuthUser; returnTo: string } | null>;
  completeProfile: (input: CompleteProfileInput) => Promise<AuthUser>;
}


/** Pull the account's real notifications once the session is real. */
function loadRemoteNotifications(userId: string): void {
  notificationsRepo
    .listMine(userId)
    .then((list) => useUIStore.getState().setRemoteNotifications(list))
    .catch(() => {
      /* the drawer refetches on open */
    });
}

/** An invite link brought this account in? Claim it once the session is real. */
async function claimStoredReferral(userId: string): Promise<void> {
  const code = storedReferralCode();
  if (!code) return;
  try {
    const result = await referralRepo.claim(userId, code);
    if (result === 'claimed') {
      clearStoredReferral();
      useUserStore.getState().addRewardPoints(25);
      useUIStore.getState().showToast('🎉 مبروك! كسبت 25 نقطة هدية الدعوة');
    } else if (result === 'self' || result === 'already') {
      clearStoredReferral();
    }
    // bad_code: keep the stored code, a typo can fix itself later
  } catch (error) {
    console.warn('[qaryati] referral claim', error);
  }
}

/** Survives the trip to Google and back (same tab). */
const GOOGLE_RETURN_KEY = 'qaryati_google_return_to';

function googleCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,

      login: async (input) => {
        const session = await authRepo.login(input);
        set({ session });
        useUserStore.getState().applyAuthUser(session.user);
        void claimStoredReferral(session.user.id);
        loadRemoteNotifications(session.user.id);
        return session.user;
      },

      register: async ({ confirmPassword: _confirm, ...input }) => {
        const result = await authRepo.register(input);
        if (result.status === 'confirm_email') return { confirmEmail: result.email };
        set({ session: result.session });
        useUserStore.getState().applyAuthUser(result.session.user);
        void claimStoredReferral(result.session.user.id);
        return { user: result.session.user };
      },

      logout: async () => {
        const token = get().session?.token;
        set({ session: null });
        useUserStore.getState().resetToGuest();
        useUIStore.getState().setRemoteNotifications([]);
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
        if (get().session?.user.id !== session.user.id || get().session?.token !== session.token) return;
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

      setAvatar: async (photo) => {
        const session = get().session;
        if (!session) throw new AuthError('rejected', 'سجّل دخولك الأول');
        const user = await authRepo.setAvatar(session.user.id, photo);
        set({ session: { ...session, user } });
      },

      signInWithGoogle: async (returnTo) => {
        try {
          sessionStorage.setItem(GOOGLE_RETURN_KEY, returnTo);
        } catch {
          // Private mode: the customer lands on the profile page instead
        }
        await authRepo.signInWithGoogle(googleCallbackUrl());
      },

      finishGoogleSignIn: async () => {
        let returnTo = '';
        try {
          returnTo = sessionStorage.getItem(GOOGLE_RETURN_KEY) ?? '';
          sessionStorage.removeItem(GOOGLE_RETURN_KEY);
        } catch {
          // ignore
        }
        const session = await authRepo.restoreSession();
        if (!session) return null;
        set({ session });
        useUserStore.getState().applyAuthUser(session.user);
        void claimStoredReferral(session.user.id);
        loadRemoteNotifications(session.user.id);
        return { user: session.user, returnTo };
      },

      completeProfile: async (input) => {
        const session = get().session;
        if (!session) throw new AuthError('not_found', 'سجّل دخول الأول');
        const user = await authRepo.completeProfile(session.user.id, input);
        set({ session: { ...session, user } });
        useUserStore.getState().applyAuthUser(user);
        return user;
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
export const selectRole = (state: AuthState) => state.session?.user.role;
export const selectIsStaff = (state: AuthState) => isStaffRole(state.session?.user.role);
export const selectIsOwner = (state: AuthState) => state.session?.user.role === 'owner';
export const selectCanReview = (state: AuthState) => canReviewContent(state.session?.user.role);
export const selectCanManageProviders = (state: AuthState) => canManageProviders(state.session?.user.role);

// Zustand's localStorage hydration is synchronous. Reconcile the restored owner
// before any page renders, then clear private order state on every auth boundary.
useOrderStore.getState().setOwner(useAuthStore.getState().session?.user.id ?? null);
useAuthStore.subscribe((state) => {
  useOrderStore.getState().setOwner(state.session?.user.id ?? null);
});

// Another tab can sign out or switch accounts. Reconcile this tab too, rather
// than leaving the previous account's private order screen in memory.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'qaryati_auth_session' || event.key === null) {
      if (localStorage.getItem('qaryati_auth_session') === null) {
        useAuthStore.setState({ session: null });
        useUserStore.getState().resetToGuest();
      } else {
        void useAuthStore.persist.rehydrate();
      }
    }
  });
}
