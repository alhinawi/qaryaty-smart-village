import { describe, expect, it } from 'vitest';
import { SHOPS } from '@/data/shops';
import { SERVICES } from '@/data/services';
import { isQuickNeedsNight, nightOpenShops, openNowShops, quickNeedServices, quickNeedShops, quickNeedsVisible, QUICK_NEEDS_NIGHT_END_MIN, QUICK_NEEDS_NIGHT_START_MIN } from './quickNeeds';
describe('quick need catalog navigation, not live status', () => {
  it('only returns the selected kind and bounds the list', () => {
    expect(quickNeedShops(SHOPS, 'pharmacy').every(shop => shop.kind === 'pharmacy')).toBe(true);
    expect(quickNeedShops(SHOPS, 'pharmacy').length).toBeLessThanOrEqual(4);
    expect(quickNeedShops(SHOPS, 'grocery').every(shop => ['grocery'].includes(shop.kind!))).toBe(true);
  });
  it('does not mistake a static open flag for availability', () => {
    const shop = { ...SHOPS[0], open: false };
    expect(quickNeedShops([shop], 'grocery')).toEqual([shop]);
  });
  it('routes delivery only to catalog delivery services', () => {
    expect(quickNeedShops(SHOPS, 'delivery')).toEqual([]);
    expect(quickNeedServices(SERVICES, 'delivery').every(service => service.cat === 'delivery')).toBe(true);
    expect(quickNeedServices(SERVICES, 'pharmacy')).toEqual([]);
  });
  it('does not fabricate choices on empty catalogs', () => {
    expect(quickNeedShops([], 'pharmacy')).toEqual([]);
    expect(quickNeedServices([], 'delivery')).toEqual([]);
  });
});

// Africa/Cairo is UTC+2 on these November dates, so 22:00Z is midnight Cairo.
const at = (utc: string) => new Date(`2026-11-07T${utc}:00Z`);

describe('quick-needs night window', () => {
  it('is midnight to 6 AM Cairo as one constant range', () => {
    expect(QUICK_NEEDS_NIGHT_START_MIN).toBe(0);
    expect(QUICK_NEEDS_NIGHT_END_MIN).toBe(6 * 60);
    expect(isQuickNeedsNight(at('22:00'))).toBe(true); // 00:00 Cairo, window opens
    expect(isQuickNeedsNight(at('02:30'))).toBe(true); // 04:30 Cairo
    expect(isQuickNeedsNight(at('03:59'))).toBe(true); // 05:59 Cairo
    expect(isQuickNeedsNight(at('04:00'))).toBe(false); // 06:00 Cairo, window closes
    expect(isQuickNeedsNight(at('21:59'))).toBe(false); // 23:59 Cairo
    expect(isQuickNeedsNight(at('15:20'))).toBe(false); // 17:20 Cairo
  });

  it('shows to everyone at night, to staff in test mode only by day', () => {
    const night = at('01:00');
    const day = at('12:00');
    expect(quickNeedsVisible(night, false, false)).toBe(true);
    expect(quickNeedsVisible(night, false, true)).toBe(true);
    expect(quickNeedsVisible(day, true, true)).toBe(true);
    expect(quickNeedsVisible(day, true, false)).toBe(false);
    expect(quickNeedsVisible(day, false, true)).toBe(false);
    expect(quickNeedsVisible(day, false, false)).toBe(false);
  });

  it('lists only the shops whose hours say they are open now', () => {
    const late = { ...SHOPS[0], id: 9901, open: true, time: '⏰ 24 ساعة' };
    const sleeper = { ...SHOPS[0], id: 9902, open: true, time: '⏰ 7ص - 12م' };
    const paused = { ...SHOPS[0], id: 9903, open: false, time: '⏰ 24 ساعة' };
    const night = at('01:00'); // 03:00 Cairo
    expect(openNowShops([late, sleeper, paused], night).map((s) => s.id)).toEqual([9901]);
    expect(openNowShops([sleeper], at('06:00')).map((s) => s.id)).toEqual([9902]); // 08:00 Cairo
  });
});

describe('night list under demo mode', () => {
  const noManual = () => undefined;
  it('keeps real shops on their stated hours while demo shops use demo schedules', () => {
    // 00:30 Cairo: «سوبر ماركت الرحمة» (8ص - 1ص, real) is open, «الحاج سيد» (7ص - 12م, real) is not.
    const groceries = SHOPS.filter(shop => shop.kind === 'grocery');
    const rahma = groceries.find(shop => shop.name === 'سوبر ماركت الرحمة');
    const sayed = groceries.find(shop => shop.name === 'الحاج سيد');
    expect(rahma && sayed).toBeTruthy();
    const shown = nightOpenShops(groceries, at('22:30'), true, noManual);
    expect(shown.some(shop => shop.id === rahma!.id)).toBe(true);
    expect(shown.some(shop => shop.id === sayed!.id)).toBe(false);
  });
  it('demo shops still follow synthetic demo hours and manual close wins', () => {
    const demoGrocery = { id: -950, name: 'بقالة تجريبية', kind: 'grocery' as const, open: true, demo: true, emoji: '', description: '', time: '', bgColor: '#fff' };
    expect(nightOpenShops([demoGrocery], at('22:30'), true, noManual)).toEqual([]);
    expect(nightOpenShops([demoGrocery], at('12:00'), true, () => false)).toEqual([]);
    expect(nightOpenShops([demoGrocery], at('12:00'), true, noManual)).toEqual([demoGrocery]);
  });
  it('real shops never fall back to demo hours even in demo mode', () => {
    const groceries = SHOPS.filter(shop => shop.kind === 'grocery');
    // 07:30 Cairo: الحاج سيد open by its real hours (7ص - 12م).
    expect(nightOpenShops(groceries, at('05:30'), true, noManual).some(shop => shop.name === 'الحاج سيد')).toBe(true);
  });
});
