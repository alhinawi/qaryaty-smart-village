import { describe, it, expect } from 'vitest';
import { cairoDay, isTodaysPrice, todaysPrices, validPriceDraft } from './dailyPrices';
import type { DailyPrice } from '@/repositories/prices/types';
const row: DailyPrice = { id: '1', shopId: 1, shopName: 'محل أحمد', item: 'طماطم', unit: 'كيلو', price: 15, updatedAt: '2026-11-07T08:00:00Z' };
describe('daily merchant announcements', () => {
  it('uses Cairo date across UTC midnight', () => expect(cairoDay(new Date('2026-11-06T23:00:00Z'))).toBe('2026-11-07'));
  it('accepts today only', () => expect(isTodaysPrice(row, new Date('2026-11-07T12:00:00Z'))).toBe(true));
  it('expires at next Cairo day, not 24h later', () => expect(isTodaysPrice(row, new Date('2026-11-07T22:00:00Z'))).toBe(false));
  it('rejects future/missing/invalid dates', () => { for (const updatedAt of ['', 'oops', '2026-11-08T08:00:00Z']) expect(isTodaysPrice({ ...row, updatedAt }, new Date('2026-11-07T12:00:00Z'))).toBe(false); });
  it('rejects unknown, free, negative, infinite and oversize prices', () => { for (const price of [0, -1, NaN, Infinity, 100001, 1.001]) expect(validPriceDraft({ ...row, price })).toBe(false); });
  it('requires item/unit and known shop', () => { expect(validPriceDraft({ ...row, item: ' ' })).toBe(false); expect(validPriceDraft({ ...row, unit: ' ' })).toBe(false); expect(isTodaysPrice({ ...row, shopName: '' }, new Date('2026-11-07T12:00:00Z'))).toBe(false); });
  it('sorts latest first without mutating source', () => { const rows = [row, { ...row, id: '2', updatedAt: '2026-11-07T09:00:00Z' }]; expect(todaysPrices(rows, new Date('2026-11-07T12:00:00Z'))[0].id).toBe('2'); expect(rows[0].id).toBe('1'); });
});
