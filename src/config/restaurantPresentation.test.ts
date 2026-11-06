import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { RESTAURANTS, FOOD_TYPE_LABELS } from '@/data/catalog';
import { restaurantPresentation, HOME_COOKED_IDS } from './restaurantPresentation';
import { shopFromRow } from '@/repositories/catalog/supabaseCatalogRepo';

describe('restaurant card presentation', () => {
  it('gives all 70 restaurants different local original images, under 55KB each', () => {
    expect(RESTAURANTS).toHaveLength(70);
    const hashes = RESTAURANTS.map(shop => {
      const path = `public${shop.photo}`;
      expect(statSync(path).size).toBeLessThan(55000);
      return createHash('sha256').update(readFileSync(path)).digest('hex');
    });
    expect(new Set(RESTAURANTS.map(s => s.photo)).size).toBe(70);
    expect(new Set(hashes).size).toBe(70);
  });
  it('uses an icon rather than an unrelated photo for new restaurants', () => {
    expect(restaurantPresentation({ ...RESTAURANTS[0], id: 999, photo: 'https://unrelated.example/a.jpg' }).photo).toBeUndefined();
  });
  it('keeps home cooking consistent for live and fallback catalogs without changing IDs', () => {
    expect(FOOD_TYPE_LABELS.duck.label).toBe('أكل بيتي');
    for (const id of HOME_COOKED_IDS) {
      const shop = RESTAURANTS.find(s => s.id === id)!;
      expect(shop.foodTypes).toContain('duck');
      expect(shopFromRow({ id, kind: 'restaurant', name: shop.name, description: shop.description, emoji: shop.emoji, open: true, time: '', bg_color: '', food_types: ['fool'] }).foodTypes).toContain('duck');
    }
    expect(RESTAURANTS.find(s => s.id === 135)?.foodTypes).not.toContain('duck');
  });
});
