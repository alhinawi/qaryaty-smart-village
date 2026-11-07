// ─── Local offers repo: photo resolution and demo-sample labeling
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateDemoMode, setDemoModeFlag } from '@/config/demoMode';
import { SHOPS } from '@/data/shops';
import { createLocalOffersRepo } from './localOffersRepo';

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
});

describe('createLocalOffersRepo', () => {
  beforeEach(() => {
    storage.clear();
    setDemoModeFlag(true);
  });

  it('attaches the real shop photo to merchant offers', async () => {
    const repo = createLocalOffersRepo();
    const shop = SHOPS.find((s) => s.id === 2)!;
    await repo.create(2, shop.name, 'عرض العيش الطازج', '', 3);
    const [mine] = (await repo.listActive()).filter((o) => !o.id.startsWith('demo-offer-'));
    expect(mine.shopPhoto).toBe(shop.photo);
  });

  it('sample offer points at a real demo shop with a real photo', async () => {
    const repo = createLocalOffersRepo();
    const sample = (await repo.listActive()).find((o) => o.id === 'demo-offer-1')!;
    const shop = SHOPS.find((s) => s.id === sample.shopId)!;
    expect(sample.shopName).toBe(shop.name);
    expect(sample.shopPhoto).toBe(shop.photo);
  });

  it('hides the sample offer while the setting is unverified', async () => {
    invalidateDemoMode();
    const repo = createLocalOffersRepo();
    const ids = (await repo.listActive()).map((o) => o.id);
    expect(ids).not.toContain('demo-offer-1');
  });

  it('hides the sample offer in real mode', async () => {
    setDemoModeFlag(false);
    const repo = createLocalOffersRepo();
    const ids = (await repo.listActive()).map((o) => o.id);
    expect(ids).not.toContain('demo-offer-1');
  });
});

 it('all local saved offers hide when real mode or verification unknown', async () => { const repo=createLocalOffersRepo();setDemoModeFlag(true);await repo.create(2,'shop','offer','',3);setDemoModeFlag(false);expect(await repo.listActive()).toEqual([]);invalidateDemoMode();expect(await repo.listActive()).toEqual([]); });
