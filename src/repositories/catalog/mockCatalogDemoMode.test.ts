// ─── Mock catalog respects the demo switch: bundled sample data is demo
// content (hidden in real mode); records added on this device stay.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setDemoModeFlag } from '@/config/demoMode';
import { createMockCatalogRepo } from './mockCatalogRepo';

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
});

describe('mock catalog in real mode', () => {
  beforeEach(() => {
    storage.clear();
    setDemoModeFlag(true);
  });

  it('serves the sample data in demo mode', async () => {
    const repo = createMockCatalogRepo();
    expect((await repo.getShops()).length).toBeGreaterThan(0);
    expect((await repo.getServices()).length).toBeGreaterThan(0);
    expect((await repo.getProviders()).length).toBeGreaterThan(0);
    expect(await repo.getProducts({ id: 1, kind: 'grocery' })).not.toBeNull();
  });

  it('hides the sample data in real mode but keeps device-added records', async () => {
    const repo = createMockCatalogRepo();
    setDemoModeFlag(false);
    await repo.addShop({ name: 'محل حقيقي', kind: 'grocery', emoji: '', description: '', time: '' });
    setDemoModeFlag(false);
    const shops = await repo.getShops();
    expect(shops.map((s) => s.name)).toEqual(['محل حقيقي']);
    expect(await repo.getServices()).toEqual([]);
    expect(await repo.getProviders()).toEqual([]);
    // a sample shop's catalog products are demo content too
    expect(await repo.getProducts({ id: 1, kind: 'grocery' })).toBeNull();
  });

  it('brings the samples back when the switch flips back', async () => {
    setDemoModeFlag(false);
    const repo = createMockCatalogRepo();
    expect((await repo.getShops()).length).toBe(0);
    setDemoModeFlag(true);
    expect((await repo.getShops()).length).toBeGreaterThan(0);
  });
});
