// ─── Weekly top shops on this device (demo backend): a labeled sample
// ranking, shown only after a verified read confirmed demo mode. In real
// mode there is no real order data on the device, so the section hides.
import { isTrackingDemoMode } from '@/config/demoMode';
import { SHOPS } from '@/data/shops';
import type { TopShopsRepo, WeeklyTopShop } from './types';

const SAMPLE: Array<{ id: number; count: number }> = [
  { id: 101, count: 23 },
  { id: 2, count: 17 },
  { id: 1, count: 9 },
];

export function createLocalTopShopsRepo(): TopShopsRepo {
  return {
    async listWeekly(limit) {
      if (!isTrackingDemoMode()) return [];
      const known = new Set(SHOPS.map((s) => s.id));
      return SAMPLE.filter((s) => known.has(s.id))
        .slice(0, limit)
        .map((s): WeeklyTopShop => ({ shopId: s.id, orderCount: s.count, isSample: true }));
    },
  };
}
