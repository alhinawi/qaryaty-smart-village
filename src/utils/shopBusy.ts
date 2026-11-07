// ─── حالة «مشغول» للمحل: الطلبات شغالة، بس التحضير هياخد وقت أطول
import type { Shop } from '@/types';

/** Effective busy state: the flag is on AND (when an auto-expire was set) it
 * has not passed yet. An unparseable expiry fails closed (not busy). */
export function isShopBusy(shop: Pick<Shop, 'busy' | 'busyUntil'>, now: Date = new Date()): boolean {
  if (!shop.busy) return false;
  if (!shop.busyUntil) return true;
  const until = new Date(shop.busyUntil);
  return !Number.isNaN(until.getTime()) && until.getTime() > now.getTime();
}
