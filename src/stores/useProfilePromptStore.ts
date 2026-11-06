// ─── "Before your first order" sheet
// Like Talabat, a Google account comes in right away. The phone, village and the
// address on the map are asked for only when it places an order.
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { needsProfileCompletion } from '@/services/auth';

interface ProfilePromptState {
  open: boolean;
  /** Runs after the details are saved (e.g. opens the order form). */
  resume: (() => void) | null;
  ask: (resume?: () => void) => void;
  close: () => void;
  done: () => void;
}

export const useProfilePromptStore = create<ProfilePromptState>()((set, get) => ({
  open: false,
  resume: null,
  ask: (resume) => set({ open: true, resume: resume ?? null }),
  close: () => set({ open: false, resume: null }),
  done: () => {
    const resume = get().resume;
    set({ open: false, resume: null });
    resume?.();
  },
}));

/**
 * Call before an order. True when the account has what the delivery needs; otherwise
 * opens the sheet (and runs `resume` after it is filled) and returns false.
 */
export function ensureProfileForOrder(resume?: () => void): boolean {
  const user = useAuthStore.getState().session?.user;
  if (!user || !needsProfileCompletion(user)) return true;
  useProfilePromptStore.getState().ask(resume);
  return false;
}
