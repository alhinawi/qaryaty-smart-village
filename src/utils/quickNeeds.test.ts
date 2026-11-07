import { describe, expect, it } from 'vitest';
import { SHOPS } from '@/data/shops';
import { SERVICES } from '@/data/services';
import { quickNeedServices, quickNeedShops } from './quickNeeds';
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
