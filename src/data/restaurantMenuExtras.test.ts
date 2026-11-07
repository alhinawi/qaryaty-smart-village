import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { RESTAURANTS } from './catalog';
import { appendIllustrativeRestaurantItems, RESTAURANT_MENU_EXTRAS } from './restaurantMenuExtras';
import { cartItemFromProduct, useCartStore } from '@/stores/useCartStore';
import type { Product } from '@/types';

describe('illustrative restaurant additions', () => {
  it('expands all seventy sample menus without changing their original items or prices', () => {
    let added = 0;
    for (const shop of RESTAURANTS) {
      const fixture = RESTAURANT_MENU_EXTRAS[String(shop.id)];
      const originals: Product[] = fixture.baseline.map(item => ({ ...item, emoji: '', unit: 'طبق', step: 1 }));
      const before = JSON.stringify(originals);
      const result = appendIllustrativeRestaurantItems(shop, originals);
      expect(JSON.stringify(originals)).toBe(before);
      const originalIds = new Set(originals.map(item => item.id));
      expect(result.filter(item => originalIds.has(item.id))).toEqual(originals);
      expect(result.filter(item => !originalIds.has(item.id))).toHaveLength(fixture.items.length);
      expect(result.every(item => !item.viewOnly)).toBe(true);
      expect(result.some(item => item.section === 'أصناف إضافية للعرض')).toBe(false);
      expect(result.length).toBe(shop.id <= 114 ? 12 : originals.length + 4);
      expect(new Set(result.map(item => item.name)).size).toBe(result.length);
      expect(new Set(result.map(item => item.id)).size).toBe(result.length);
      for (const item of fixture.items) {
        expect(item.price).toBeGreaterThan(0);
        useCartStore.getState().clearCart();
        const cartItem = cartItemFromProduct(shop, item);
        expect(useCartStore.getState().addItem(cartItem).status).toBe('added');
        expect(useCartStore.getState().items[0].productId).toBe(item.id);
        expect(useCartStore.getState().getTotalAmount()).toBe(item.price * cartItem.quantity);
        expect(item.photo && existsSync(`public${item.photo}`), `${shop.name}: ${item.name}`).toBe(true);
      }
      added += fixture.items.length;
    }
    expect(RESTAURANTS).toHaveLength(70);
    expect(added).toBe(329);
  });
  it('does not add invented dishes to renamed shops, unknown merchants or merchant-edited menus', () => {
    const shop = RESTAURANTS[0];
    const fixture = RESTAURANT_MENU_EXTRAS[String(shop.id)];
    const originals: Product[] = fixture.baseline.map(item => ({ ...item, emoji: '', unit: 'طبق', step: 1 }));
    expect(appendIllustrativeRestaurantItems({ ...shop, name: 'مطعم حقيقي آخر' }, originals)).toBe(originals);
    expect(appendIllustrativeRestaurantItems({ ...shop, id: 900001 }, originals)).toBe(originals);
    const changed = originals.map((item, index) => index ? item : { ...item, price: item.price + 1 });
    expect(appendIllustrativeRestaurantItems(shop, changed)).toBe(changed);
    expect(appendIllustrativeRestaurantItems(shop, originals.slice(1))).toHaveLength(originals.length - 1);
    const expanded = appendIllustrativeRestaurantItems(shop, originals);
    expect(appendIllustrativeRestaurantItems(shop, expanded)).toBe(expanded);
  });
});
