import type { Shop } from '@/types';
import { cairoMinute } from './quickNeedsDemo';

// ─── Open-now from the stored hours text ("⏰ 7ص - 12م" / "⏰ 24 ساعة")
// The merchant's manual «مغلق» always wins; when the hours text is readable it
// closes the shop outside its range. Unreadable or missing hours fall back to
// the manual flag alone, so older free-text rows keep their old behavior.

/** "7ص" → 420, "12م" → 720 (noon), "12ص" → 0 (midnight). null when not a clock label. */
export function hourLabelToMinute(label: string): number | null {
  const match = label.trim().match(/^(\d{1,2})\s*([صم])$/);
  if (!match) return null;
  const hour = Number(match[1]);
  if (hour < 1 || hour > 12) return null;
  return ((hour % 12) + (match[2] === 'م' ? 12 : 0)) * 60;
}

/** true/false when the hours text settles open-now, null when it can't be read. */
export function hoursOpenNow(time: string | undefined, now: Date): boolean | null {
  if (!time) return null;
  if (time.includes('24')) return true;
  const range = time.match(/(\d{1,2})\s*([صم])\s*-\s*(\d{1,2})\s*([صم])/);
  if (!range) return null;
  const from = hourLabelToMinute(`${range[1]}${range[2]}`);
  const to = hourLabelToMinute(`${range[3]}${range[4]}`);
  if (from == null || to == null) return null;
  if (from === to) return true; // "9ص - 9ص" reads as around the clock
  const minute = cairoMinute(now);
  return from < to ? minute >= from && minute < to : minute >= from || minute < to;
}

/** What a customer sees: manual pause closes; known hours close outside the range. */
export function isShopOpenNow(shop: Pick<Shop, 'open' | 'time'>, now: Date = new Date()): boolean {
  if (!shop.open) return false;
  return hoursOpenNow(shop.time, now) ?? true;
}
