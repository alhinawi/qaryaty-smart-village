import { isTrackingDemoMode } from '@/config/demoMode';
import { SHOPS } from '@/data/shops';
import type { DailyOffer } from './types';
// Stable within this visit: a reload of the list does not restart the countdown.
const startedAt = Date.now();
const samples = [
  [101, 'خصم 20% على الفطار', 'فول وطعمية وسلطات، من غير المشروبات', 3],
  [2, 'خصم 10% على الفينو', 'على شراء 10 أرغفة أو أكتر', 4],
  [3, 'خصم 15% على خضار الموسم', 'على طلب خضار من 3 كيلو، حسب المتاح', 5],
  [4, 'خصم 20% على حلاقة الأطفال', 'حلاقة شعر فقط، بالحجز قبل الزيارة', 6],
  [7, 'خصم 10% على الكفتة البلدي', 'على طلب كيلو أو أكتر، حسب المتاح', 4],
  [6, 'خصم 15% على المصنعية', 'صيانة الحنفيات البسيطة، قطع الغيار مش داخلة', 6],
] as const;
/** Fictional offers on fictional catalog shops, never shown as real promotions. */
export function demoOffers(now = Date.now()): DailyOffer[] {
  if (!isTrackingDemoMode()) return [];
  return samples.flatMap(([shopId, title, details, hours], index) => {
    const shop = SHOPS.find(row => row.id === shopId);
    const endsAt = startedAt + hours * 3600_000;
    return shop && now < endsAt ? [{ id: `demo-offer-${index + 1}`, shopId, shopName: shop.name, shopPhoto: shop.photo, title, details, endsAt: new Date(endsAt).toISOString(), createdAt: new Date(startedAt).toISOString(), demo: true }] : [];
  });
}
