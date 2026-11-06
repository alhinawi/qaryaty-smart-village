import { describe, expect, it } from 'vitest';
import { DEMO_PHARMACIES, appendDemoPharmacies, demoPharmacyMenu } from './demoPharmacies';
import { PHARMACY, productsForShop } from './catalog';
import { createMockCatalogRepo } from '@/repositories/catalog/mockCatalogRepo';
describe('fictional pharmacies', () => {
  it('adds eight clearly marked, separate pharmacies with unique photos', async () => {
    expect(DEMO_PHARMACIES).toHaveLength(8);
    expect(new Set(DEMO_PHARMACIES.map(s => s.photo)).size).toBe(8);
    expect(DEMO_PHARMACIES.every(s => s.demo && !s.name.includes('تجريبية') && s.id < 0)).toBe(true);
    expect((await createMockCatalogRepo().getShops()).filter(s => s.kind === 'pharmacy').length).toBeGreaterThan(8);
  });
  it('never replaces an existing vendor and does not duplicate demos', () => {
    const real = { ...DEMO_PHARMACIES[0], name: 'real merchant', demo: undefined };
    const shops = appendDemoPharmacies([real]);
    expect(shops.find(s => s.id === real.id)).toBe(real);
    expect(demoPharmacyMenu(real, PHARMACY)).toBeNull();
    expect(appendDemoPharmacies(shops)).toEqual(shops);
  });
  it('has eight different menus, preserving medicine facts and RX flags', () => {
    const menus = DEMO_PHARMACIES.map(shop => productsForShop(shop)!);
    expect(new Set(menus.map(menu => menu.map(p => p.id).join(','))).size).toBe(8);
    for (const menu of menus) {
      expect(menu.length).toBeGreaterThan(30);
      for (const product of menu) expect(product).toEqual(PHARMACY.find(p => p.id === product.id));
    }
  });
});
