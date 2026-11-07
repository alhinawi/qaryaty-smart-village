import type { DailyPrice, PriceDraft } from '@/repositories/prices/types';
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
export function cairoDay(date: Date): string { return day.format(date); }
export function validPriceDraft(draft: PriceDraft): boolean {
  return draft.item.trim().length > 0 && draft.item.trim().length <= 80 &&
    draft.unit.trim().length > 0 && draft.unit.trim().length <= 30 &&
    Number.isFinite(draft.price) && draft.price > 0 && draft.price <= 100000 &&
    Math.abs(draft.price * 100 - Math.round(draft.price * 100)) < 0.000001;
}
/** Cairo calendar day, not a rolling 24h. Unknown/future dates fail closed. */
export function isTodaysPrice(row: DailyPrice, now = new Date()): boolean {
  const date = new Date(row.updatedAt);
  return Number.isFinite(date.getTime()) && date <= now && cairoDay(date) === cairoDay(now) &&
    validPriceDraft(row) && row.shopName.trim().length > 0;
}
export function todaysPrices(rows: DailyPrice[], now = new Date()): DailyPrice[] {
  return rows.filter(row => isTodaysPrice(row, now)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
