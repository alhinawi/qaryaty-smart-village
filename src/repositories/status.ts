// ─── Backend status, shown by <ServiceStatusBanner />
// demo:     no Supabase configured, the app runs on sample data (as before).
// live:     Supabase answered.
// degraded: Supabase failed or is paused. Reads show sample data, writes are refused.
import { create } from 'zustand';

export type BackendMode = 'demo' | 'live' | 'degraded';

export interface StatusReporter {
  markLive(): void;
  markDegraded(): void;
}

interface BackendStatusState {
  mode: BackendMode;
  setMode: (mode: BackendMode) => void;
}

export const useBackendStatus = create<BackendStatusState>()((set) => ({
  mode: 'demo',
  setMode: (mode) => set((state) => (state.mode === mode ? state : { mode })),
}));

/** Reporter the live repositories use. */
export const backendStatus: StatusReporter = {
  markLive: () => useBackendStatus.getState().setMode('live'),
  markDegraded: () => useBackendStatus.getState().setMode('degraded'),
};
