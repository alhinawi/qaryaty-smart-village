// ─── useTrackingDemoMode: verified demo-mode snapshot for simulated/fake
// content. Unlike useDemoMode() (last known value), this is false before the
// first successful settings read and after any failed one — simulated content
// fails closed instead of leaking into real mode on an unknown setting.
import { useSyncExternalStore } from 'react';
import { isTrackingDemoMode, subscribeDemoMode } from '@/config/demoMode';

export function useTrackingDemoMode(): boolean {
  return useSyncExternalStore(subscribeDemoMode, isTrackingDemoMode);
}
