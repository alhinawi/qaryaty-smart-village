import { it, expect } from 'vitest';
import { setDemoModeFlag, invalidateDemoMode } from '@/config/demoMode';
import { demoOffers } from './demoOffers';
it('six varied samples reference known fictional shops/photos, no fake real records', () => {setDemoModeFlag(true);const rows=demoOffers();expect(rows).toHaveLength(6);expect(new Set(rows.map(r=>r.shopId)).size).toBe(6);expect(rows.every(r=>r.demo&&r.shopPhoto&&r.details)).toBe(true);});
it('countdowns do not restart on refresh', () => {setDemoModeFlag(true);const first=demoOffers();const next=demoOffers();expect(next.map(r=>r.endsAt)).toEqual(first.map(r=>r.endsAt));});
it('off, unknown and expired never produce samples', () => {setDemoModeFlag(false);expect(demoOffers()).toEqual([]);invalidateDemoMode();expect(demoOffers()).toEqual([]);setDemoModeFlag(true);expect(demoOffers(Date.now()+86400000)).toEqual([]);});
