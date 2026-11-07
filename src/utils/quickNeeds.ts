import type { Service, Shop } from '@/types';

export type QuickNeed = 'pharmacy' | 'grocery' | 'delivery';
/** Discovery only: a catalog flag is not proof of current availability. */
export function quickNeedShops(shops: Shop[], need: QuickNeed): Shop[] {
  if (need === 'delivery') return [];
  return shops.filter(shop => need === 'pharmacy'
    ? shop.kind === 'pharmacy'
    : shop.kind === 'grocery').slice(0, 4);
}
export function quickNeedServices(services: Service[], need: QuickNeed): Service[] {
  return need === 'delivery' ? services.filter(service => service.cat === 'delivery' && /توصيل|سوبر ماركت|توكتوك/.test(service.name)).slice(0, 4) : [];
}
