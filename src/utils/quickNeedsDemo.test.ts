import { describe, expect, it } from 'vitest';
import { cairoMinute, demoOpenNow, demoRiderAvailable } from './quickNeedsDemo';
const grocery = { id: 1, kind: 'grocery' as const, open: true };
describe('demo-only quick needs schedule', () => {
  it('uses Cairo local time, including DST', () => {
    expect(cairoMinute(new Date('2026-11-07T05:00:00Z'))).toBe(420);
    expect(cairoMinute(new Date('2026-07-07T04:00:00Z'))).toBe(420);
  });
  it('bounds opening and midnight closure', () => {
    expect(demoOpenNow(grocery,new Date('2026-11-07T04:59:00Z'))).toBe(false);
    expect(demoOpenNow(grocery,new Date('2026-11-07T05:00:00Z'))).toBe(true);
    expect(demoOpenNow(grocery,new Date('2026-11-07T22:00:00Z'))).toBe(false);
  });
  it('manual close always wins, even for 24h pharmacies', () => {
    expect(demoOpenNow({id:-801,kind:'pharmacy',open:true},new Date('2026-11-07T10:00:00Z'),false)).toBe(false);
    expect(demoOpenNow({...grocery,open:false},new Date('2026-11-07T10:00:00Z'))).toBe(false);
  });
  it('handles overnight pharmacies and rider night hours', () => {
    const shop = {id:-801,kind:'pharmacy' as const,open:true};
    expect(demoOpenNow(shop,new Date('2026-11-06T23:00:00Z'))).toBe(true);
    expect(demoOpenNow(shop,new Date('2026-11-07T01:00:00Z'))).toBe(false);
    expect(demoRiderAvailable(new Date('2026-11-07T04:00:00Z'))).toBe(false);
  });
});
