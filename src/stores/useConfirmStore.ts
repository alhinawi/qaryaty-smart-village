import { create } from 'zustand';

// One yes/no question at a time, answered in an Arabic dialog (not the
// browser's confirm(), whose buttons follow the phone's language).

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

interface ConfirmStore {
  request: ConfirmRequest | null;
  resolve: ((ok: boolean) => void) | null;
  /** Opens the dialog; resolves true on confirm, false on cancel or close. */
  ask: (request: ConfirmRequest) => Promise<boolean>;
  answer: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>()((set, get) => ({
  request: null,
  resolve: null,
  ask: (request) =>
    new Promise<boolean>((resolve) => {
      // A new question cancels one still open
      get().resolve?.(false);
      set({ request, resolve });
    }),
  answer: (ok) => {
    get().resolve?.(ok);
    set({ request: null, resolve: null });
  },
}));
