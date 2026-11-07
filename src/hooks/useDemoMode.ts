// ─── useDemoMode: React binding for the demo-mode flag — re-renders the
// moment the switch flips (admin toggle, startup load, or cross-device
// refresh from the background watcher).
import { useSyncExternalStore } from 'react';
import { isDemoMode, subscribeDemoMode } from '@/config/demoMode';

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribeDemoMode, isDemoMode);
}
