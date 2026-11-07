// ─── Weekly top shops (demo backend): labeled sample in verified demo mode,
// empty in real mode so the section hides
import { beforeEach, describe, expect, it } from 'vitest';
import { invalidateDemoMode, setDemoModeFlag } from '@/config/demoMode';
import { createLocalTopShopsRepo } from './localTopShopsRepo';

describe('createLocalTopShopsRepo', () => {
  beforeEach(() => setDemoModeFlag(true));

  it('returns a labeled sample ranking in verified demo mode', async () => {
    const top = await createLocalTopShopsRepo().listWeekly(5);
    expect(top.length).toBeGreaterThanOrEqual(3);
    expect(top.every((t) => t.isSample)).toBe(true);
    expect(top[0].orderCount).toBeGreaterThan(top[1].orderCount);
  });

  it('returns nothing in real mode', async () => {
    setDemoModeFlag(false);
    expect(await createLocalTopShopsRepo().listWeekly(5)).toEqual([]);
  });

  it('returns nothing while the setting is unverified', async () => {
    invalidateDemoMode();
    expect(await createLocalTopShopsRepo().listWeekly(5)).toEqual([]);
    setDemoModeFlag(true);
  });
});
