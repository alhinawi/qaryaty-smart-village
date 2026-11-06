import type { Product, Shop } from '@/types';

/** Fictional presentation-only examples, never merchant records or live stock. */
export const DEMO_PHARMACIES: Shop[] = [
  ['صيدلية النسيم', 'منية سندوب'],
  ['صيدلية بيت الصحة', 'سندوب'],
  ['صيدلية زهرة البلد', 'نقيطة'],
  ['صيدلية ركن العافية', 'شاوة'],
  ['صيدلية الدار الخضراء', 'ميت خميس'],
  ['صيدلية صباح الخير', 'منية سندوب'],
  ['صيدلية جسر الصحة', 'سندوب'],
  ['صيدلية نبع العافية', 'نقيطة'],
].map(([name, village], index) => ({
  id: -801 - index, name: `${name} (تجريبية)`, village, kind: 'pharmacy', emoji: '💊',
  description: 'بيانات خيالية للتجربة، ليست صيدلية حقيقية ولا تعبر عن مخزون متاح. الأدوية بروشتة بعد مراجعة الصيدلي.',
  demo: true, open: true, time: '⏰ مواعيد تجريبية: 9ص - 11م', bgColor: '#EAF7F1',
  photo: `/img/pharmacies/demo-${index + 1}.webp`,
}));

export function appendDemoPharmacies(shops: Shop[]): Shop[] {
  return [...shops, ...DEMO_PHARMACIES.filter(demo => !shops.some(shop => shop.id === demo.id))];
}

/** Eight distinct illustrative selections, keeping the source names, prices and RX flags. */
export function demoPharmacyMenu(shop: Pick<Shop, 'id' | 'kind' | 'demo'>, products: Product[]): Product[] | null {
  if (!shop.demo || shop.kind !== 'pharmacy') return null;
  const index = DEMO_PHARMACIES.findIndex(demo => demo.id === shop.id);
  if (index < 0) return null;
  return products.filter((_, position) => position < 8 || (position + index * 7) % 23 < 12);
}
