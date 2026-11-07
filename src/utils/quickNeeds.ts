import type { Service, Shop } from '@/types';
import { cairoMinute, demoOpenNow } from './quickNeedsDemo';
import { isShopOpenNow } from './shopOpenNow';

export type QuickNeed = 'pharmacy' | 'grocery' | 'delivery';

// ─── «محتاج دلوقتي» night window (Cairo time): inside these hours the card
// shows itself to everyone with the late-night shops; outside them it is
// hidden except for staff previewing it in test mode from the admin panel.
/** Window start: midnight Cairo, in minutes after midnight. */
export const QUICK_NEEDS_NIGHT_START_MIN = 0;
/** Window end: 6 AM Cairo, in minutes after midnight. */
export const QUICK_NEEDS_NIGHT_END_MIN = 6 * 60;

/** true inside the night window (00:00-06:00 Cairo). */
export function isQuickNeedsNight(now: Date): boolean {
  const minute = cairoMinute(now);
  return minute >= QUICK_NEEDS_NIGHT_START_MIN && minute < QUICK_NEEDS_NIGHT_END_MIN;
}

/** The «بتسهر» list: shops whose stated hours say they're open right now. */
export function openNowShops(shops: Shop[], now: Date): Shop[] {
  return shops.filter((shop) => isShopOpenNow(shop, now));
}

/**
 * Night list under demo mode: demo shops keep their synthetic demo schedules
 * (they carry no real hours), while real shops always keep their own stated
 * hours so a supermarket that says it stays open late shows as open late.
 */
export function nightOpenShops(shops: Shop[], now: Date, demo: boolean, manualOpen: (id: number) => boolean | undefined): Shop[] {
  if (!demo) return openNowShops(shops, now);
  return shops.filter((shop) => (shop.demo ? demoOpenNow(shop, now, manualOpen(shop.id)) : isShopOpenNow(shop, now)));
}

/** Who sees the card: everyone at night; staff in test mode at any hour. */
export function quickNeedsVisible(now: Date, isStaff: boolean, testMode: boolean): boolean {
  return isQuickNeedsNight(now) || (isStaff && testMode);
}
/** Discovery only: a catalog flag is not proof of current availability. */
export function quickNeedShops(shops: Shop[], need: QuickNeed): Shop[] {
  if (need === 'delivery') return [];
  return shops.filter(shop => need === 'pharmacy'
    ? shop.kind === 'pharmacy'
    : shop.kind === 'grocery').slice(0, 4);
}
export function quickNeedServices(services: Service[], need: QuickNeed): Service[] {
  return need === 'delivery' ? services.filter(service => service.cat === 'delivery' && /توصيل|مرسول|سوبر ماركت|توكتوك/.test(service.name)).slice(0, 4) : [];
}
