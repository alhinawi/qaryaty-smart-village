// ─── Services that are really shops (عيش، خضار، ألبان، جزارة): they open the
// village's shops of that kind, so the customer picks products, never the whole service.
import type { CartItem, Service, Shop, ShopKind } from '@/types';
import { isShopOpenNow } from './shopOpenNow';

/** Service id → the kinds of shop that sell what it is about. */
export const SERVICE_SHOP_KINDS: Readonly<Record<number, ShopKind[]>> = {
  1: ['bakery'], // عيش من الفرن
  9: ['veg', 'fruit'], // خضار وفاكهة
  14: ['dairy'], // لقمة من بهايم: لبن وجبنة
  32: ['butcher', 'poultry'], // جزارة
};

/** The kinds of shop a service opens, or null for a real service (سباك، مدرس…). */
export function shopKindsForService(service: Pick<Service, 'id'>): ShopKind[] | null {
  return SERVICE_SHOP_KINDS[service.id] ?? null;
}

export function isShopService(service: Pick<Service, 'id'>): boolean {
  return shopKindsForService(service) !== null;
}

/** The village's shops for a shop-like service, open ones first, in the kinds' order. */
export function shopsForService(service: Pick<Service, 'id'>, shops: Shop[]): Shop[] {
  const kinds = shopKindsForService(service);
  if (!kinds) return [];
  const rank = (shop: Shop) => kinds.indexOf(shop.kind as ShopKind);
  return shops
    .filter((shop) => !shop.demo && rank(shop) >= 0)
    .sort((a, b) => Number(isShopOpenNow(b)) - Number(isShopOpenNow(a)) || rank(a) - rank(b));
}

/**
 * A cart line that is a whole shop-like service ("عيش من الفرن ١٠ ج"), put there by the old
 * "+ إضافة" button. Carts saved on phones drop these.
 */
export function isWholeShopLine(item: Pick<CartItem, 'id' | 'serviceId' | 'productId' | 'shopId'>): boolean {
  if (item.productId || item.shopId) return false;
  return item.id === `service-${item.serviceId}` && isShopService({ id: item.serviceId });
}

/**
 * Shops that sell things open their product list, even before it has any (it then says so).
 * Only shops of no product kind (صالون، ورشة، مغسلة) take a written order instead.
 */
export function sellsProducts(shop: Pick<Shop, 'kind'>): boolean {
  return Boolean(shop.kind) && shop.kind !== 'other';
}
