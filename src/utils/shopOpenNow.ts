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

/** Egyptian-spoken clock: 0→"12 بالليل", 1-5AM→"X بالليل", 6-11AM→"X الصبح", noon→"12 الضهر", 1-5PM→"X العصر", 6-11PM→"X مساءً". */
export function minuteToSpoken(minute: number): string {
  const h24 = Math.floor(minute / 60) % 24;
  if (h24 === 0) return '12 بالليل';
  if (h24 <= 5) return `${h24} بالليل`;
  if (h24 < 12) return `${h24} الصبح`;
  if (h24 === 12) return '12 الضهر';
  const h = h24 - 12;
  return h <= 5 ? `${h} العصر` : `${h} مساءً`;
}

/** 420, 1440 → "من 7 الصبح لحد 12 بالليل". */
export function spokenHoursRange(fromMinute: number, toMinute: number): string {
  return `من ${minuteToSpoken(fromMinute)} لحد ${minuteToSpoken(toMinute)}`;
}

/** "⏰ 8ص - 1ص" → "من 8 الصبح لحد 1 بالليل"; "24 ساعة" stays; null when unreadable. */
export function hoursDisplayLabel(time: string | undefined): string | null {
  if (!time) return null;
  if (time.includes('24')) return '24 ساعة';
  const range = time.match(/(\d{1,2})\s*([صم])\s*-\s*(\d{1,2})\s*([صم])/);
  if (!range) return null;
  const from = hourLabelToMinute(`${range[1]}${range[2]}`);
  const to = hourLabelToMinute(`${range[3]}${range[4]}`);
  if (from == null || to == null) return null;
  return spokenHoursRange(from, to);
}
