import { describe, expect, it } from 'vitest';
import { SERVICES } from '@/data/services';
import { FOOD_TYPE_LABELS, MENUS, RESTAURANTS } from '@/data/catalog';
import type { FoodType } from '@/types';
import { createMockCatalogRepo } from './mockCatalogRepo';
import { productFromRow, productScope, providerFromRow, serviceFromRow, shopFromRow } from './supabaseCatalogRepo';

describe('mock catalog repo', () => {
  it('returns the sample services without hidden ones', async () => {
    const services = await createMockCatalogRepo().getServices();
    expect(services.length).toBe(SERVICES.filter((s) => !s.hidden).length);
    expect(services.every((s) => !s.hidden)).toBe(true);
  });
});

describe('supabase row mapping', () => {
  it('maps snake_case rows to the app types', () => {
    const service = serviceFromRow({
      id: 1, cat: 'edu', emoji: '📚', name: 'مدرس عربي', description: 'حصص', time: 'بالحصة',
      price: 'من 50 ج', numeric_price: 50, price_type: 'from', rating: '4.9', badge: null,
      featured: false, subject: 'arabic', options: [], hidden: false,
    });
    expect(service).toMatchObject({ desc: 'حصص', numericPrice: 50, priceType: 'from', badge: '', subject: 'arabic' });
    expect(service.options).toBeUndefined();

    expect(shopFromRow({ id: 2, emoji: '🛒', name: 'بقالة', description: 'x', open: true, time: '24 ساعة', bg_color: '#fff' }).bgColor).toBe('#fff');

    const provider = providerFromRow({
      id: 3, kind: 'nurse', service_id: 9, name: 'م. سارة', gender: 'female', photo: null, subject: null,
      stages: null, specialty: null, experience_years: 5, rating: 4.7, reviews: 10, price: '150 ج',
      numeric_price: 150, price_type: 'fixed', area: 'الحي الغربي', village: 'منية سندوب', bio: 'حقن وغيار', modes: ['home'], active: true,
    });
    expect(provider).toMatchObject({ serviceId: 9, experienceYears: 5, photo: '', village: 'منية سندوب' });
    expect(provider.stages).toBeUndefined();
  });
});

describe('shop menus through the repository', () => {
  it('mock repo returns each restaurant menu and nothing for shops without a list', async () => {
    const repo = createMockCatalogRepo();
    for (const shop of RESTAURANTS) {
      expect(await repo.getProducts(shop)).toEqual(MENUS[shop.id]);
    }
    expect(await repo.getProducts({ id: 999, kind: 'other' })).toBeNull();
  });

  it('uses the same scope as public.shop_scope()', () => {
    expect(productScope({ id: 104, kind: 'restaurant' })).toBe('restaurant:104');
    expect(productScope({ id: 3, kind: 'fish' })).toBe('fish');
  });

  it('maps catalog_products rows (as seeded) back to the same products', () => {
    for (const [shopId, menu] of Object.entries(MENUS)) {
      menu.forEach((p, position) => {
        const row = {
          scope: `restaurant:${shopId}`, product_id: p.id, name: p.name, price: String(p.price), unit: p.unit,
          step: String(p.step ?? 1), grillable: p.grillable ?? false, rx: p.rx ?? false, emoji: p.emoji,
          section: p.section ?? '', photo: p.photo ?? null, position,
        };
        expect(productFromRow(row)).toEqual(p);
      });
    }
  });

  it('every restaurant has a cover photo and dish photos are https', () => {
    for (const shop of RESTAURANTS) expect(shop.photo).toMatch(/^https:\/\//);
    for (const menu of Object.values(MENUS)) {
      for (const p of menu) if (p.photo) expect(p.photo).toMatch(/^https:\/\//);
    }
  });

  it('every food type has at least five restaurants, each with a priced menu', () => {
    const ids = RESTAURANTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const type of Object.keys(FOOD_TYPE_LABELS)) {
      const count = RESTAURANTS.filter((s) => s.foodTypes?.includes(type as FoodType)).length;
      expect(count, type).toBeGreaterThanOrEqual(5);
    }
    for (const shop of RESTAURANTS) {
      const menu = MENUS[shop.id];
      expect(menu, shop.name).toBeDefined();
      // The first fourteen keep their short menus; the added ones have full menus.
      expect(menu.length).toBeGreaterThanOrEqual(shop.id >= 115 ? 6 : 3);
      expect(new Set(menu.map((p) => p.id)).size).toBe(menu.length);
      for (const p of menu) expect(p.price).toBeGreaterThan(0);
      expect(shop.rating).toBeGreaterThan(0);
      expect(shop.deliveryTime).toBeTruthy();
      expect(shop.village).toBeTruthy();
    }
  });

  it('maps rating, delivery time and village from a shop row', () => {
    const shop = shopFromRow({
      id: 115, emoji: '🧆', name: 'x', description: '', open: true, time: '', bg_color: '#fff',
      kind: 'restaurant', food_types: ['fool'], rating: '4.7', delivery_time: '15-25 دقيقة', village: 'منية سندوب',
    });
    expect(shop.rating).toBe(4.7);
    expect(shop.deliveryTime).toBe('15-25 دقيقة');
    expect(shop.village).toBe('منية سندوب');
  });
});
