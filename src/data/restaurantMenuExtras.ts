import type { Product, Shop } from '@/types';
import extraData from './restaurantMenuExtras.json';

type SampleMenu = { name: string; baseline: { id: string; name: string; price: number }[]; items: Product[] };
export const RESTAURANT_MENU_EXTRAS: Record<string, SampleMenu> = extraData;
export type MenuShop = Pick<Shop, 'id' | 'kind' | 'demo'> & Partial<Pick<Shop, 'name'>>;

/**
 * Approved additions to unchanged, known sample menus. A renamed shop,
 * merchant-edited menu, or custom merchant gets no invented stock or prices.
 * Original product objects and their order are never changed.
 */
export function appendIllustrativeRestaurantItems(shop: MenuShop, products: Product[]): Product[] {
  if (shop.kind !== 'restaurant') return products;
  const sample = RESTAURANT_MENU_EXTRAS[String(shop.id)];
  if (!sample || shop.name !== sample.name) return products;
  if (products.length !== sample.baseline.length) return products;
  const byId = new Map(products.map(product => [product.id, product]));
  if (!sample.baseline.every(base => {
    const product = byId.get(base.id);
    return product?.name === base.name && product.price === base.price && product.available !== false;
  })) return products;
  const names = new Set(products.map(product => product.name));
  const extras = sample.items.filter(product => !names.has(product.name));
  const inserted = new Set<Product>();
  const result: Product[] = [];
  products.forEach((product, index) => {
    result.push(product);
    if (products.slice(index + 1).some(next => next.section === product.section)) return;
    extras.filter(extra => extra.section === product.section).forEach(extra => { result.push(extra); inserted.add(extra); });
  });
  return [...result, ...extras.filter(extra => !inserted.has(extra))];
}
