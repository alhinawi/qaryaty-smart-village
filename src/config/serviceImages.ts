import type { Service, ServiceCategory } from '@/types';

/** Original illustrations made for Qaryati, not photos of actual providers. */
export const SERVICE_IMAGES: Record<ServiceCategory, string> = {
  food: '/img/services/food.webp',
  delivery: '/img/services/delivery.webp',
  craft: '/img/services/craft.webp',
  care: '/img/services/care.webp',
  edu: '/img/services/edu.webp',
  health: '/img/services/health.webp',
  home: '/img/services/home.webp',
  finishing: '/img/services/finishing.webp',
};

const SERVICE_SPECIFIC_IMAGES: Record<number, string> = {
  2: '/img/services/fish.webp',
  5: '/img/services/waste.webp',
  8: '/img/services/barber.webp',
  9: '/img/services/produce.webp',
  13: '/img/services/cooking.webp',
  14: '/img/services/butcher.webp',
  31: '/img/services/laundry.webp',
  32: '/img/services/butcher.webp',
  42: '/img/services/gas.webp',
};
export function imageForService(service: Pick<Service, 'id' | 'cat'>): string {
  return SERVICE_SPECIFIC_IMAGES[service.id] ?? SERVICE_IMAGES[service.cat];
}
