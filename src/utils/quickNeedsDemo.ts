import type { Shop } from '@/types';
export interface DemoHours { from: number; to: number; allDay?: boolean }
export function cairoMinute(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  return Number(parts.find(part => part.type === 'hour')?.value) * 60 + Number(parts.find(part => part.type === 'minute')?.value);
}
/** Synthetic schedules used ONLY inside verified demo presentation. */
export function demoHours(shop: Pick<Shop, 'id' | 'kind'>): DemoHours {
  if (shop.kind === 'pharmacy') return Math.abs(shop.id) % 3 === 0 ? { from: 9 * 60, to: 2 * 60 } : { from: 0, to: 0, allDay: true };
  return { from: 7 * 60, to: 24 * 60 };
}
export function demoOpenNow(shop: Pick<Shop, 'id' | 'kind' | 'open'>, now: Date, manualOpen?: boolean): boolean {
  if (manualOpen === false || (manualOpen === undefined && !shop.open)) return false;
  const hours = demoHours(shop);
  if (hours.allDay) return true;
  const minute = cairoMinute(now);
  return hours.from < hours.to ? minute >= hours.from && minute < hours.to : minute >= hours.from || minute < hours.to;
}
/** Not a location or driver feed. No driver identity or phone is fabricated. */
export function demoRiderAvailable(now: Date): boolean { return cairoMinute(now) >= 7 * 60; }
export function demoHoursLabel(shop: Pick<Shop, 'id' | 'kind'>): string { return demoHours(shop).allDay ? '٢٤ ساعة' : shop.kind === 'pharmacy' ? '٩ صباحًا - ٢ صباحًا' : '٧ صباحًا - ١٢ بالليل'; }
