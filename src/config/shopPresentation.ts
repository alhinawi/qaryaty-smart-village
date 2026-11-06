import type { Shop } from '@/types';

// Generic generated scenes, not merchant photographs. Match known identity, not future IDs alone.
const SHOP_NAMES: Record<number, string> = {
  1: 'الحاج سيد',
  2: 'فرن الأصيل',
  3: 'خضار الفلاح',
  4: 'صالون أبو العز',
  5: 'عم صابر',
  6: 'ورشة أبو خالد',
  7: 'جزارة الحاج عبده',
  8: 'مغسلة ومكوجي النور',
  9: 'أسماك أبو حسن',
  10: 'فاكهة البركة',
  11: 'سوبر ماركت الرحمة',
  12: 'فرارجي الأمانة',
  13: 'حلواني الملكة',
  14: 'عطارة الشيخ عبد الله',
  15: 'بن البرازيلي',
  16: 'ألبان المزرعة',
  17: 'مكتبة النور',
  18: 'أدوات منزلية الأمل',
  19: 'صيدلية الشفاء',
};

export function shopPresentation(shop: Shop): Shop {
  if (shop.kind === 'restaurant' || shop.photo || SHOP_NAMES[shop.id] !== shop.name) return shop;
  return { ...shop, photo: `/img/shops/shop-${shop.id}.webp` };
}
