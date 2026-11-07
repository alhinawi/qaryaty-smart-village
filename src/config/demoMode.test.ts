// ─── Demo-mode flag: change notification and verified-tracking semantics
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateDemoMode, isDemoMode, isTrackingDemoMode, setDemoModeFlag, subscribeDemoMode } from './demoMode';

describe('demo mode flag', () => {
  beforeEach(() => setDemoModeFlag(true));

  it('notifies subscribers synchronously on every set', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDemoMode(listener);
    setDemoModeFlag(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(isDemoMode()).toBe(true);
    setDemoModeFlag(false);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(isDemoMode()).toBe(false);
    unsubscribe();
    setDemoModeFlag(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('tracking flag fails closed until a verified read, and hides on invalidate', () => {
    invalidateDemoMode();
    expect(isTrackingDemoMode()).toBe(false);
    setDemoModeFlag(true);
    expect(isTrackingDemoMode()).toBe(true);
    let observed: boolean | undefined;
    const unsubscribe = subscribeDemoMode(() => {
      observed = isTrackingDemoMode();
    });
    setDemoModeFlag(false);
    expect(observed).toBe(false);
    setDemoModeFlag(true);
    invalidateDemoMode();
    expect(observed).toBe(false);
    unsubscribe();
    setDemoModeFlag(true);
  });
});
