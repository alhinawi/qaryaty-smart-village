import { describe, expect, it } from 'vitest';
import { hourLabelToMinute, hoursOpenNow, isShopOpenNow } from './shopOpenNow';

// Africa/Cairo is UTC+2 on these November dates (same convention as
// quickNeedsDemo.test.ts), so 05:00Z is 7:00 in Cairo.
const at = (utc: string) => new Date(`2026-11-07T${utc}:00Z`);

describe('hourLabelToMinute', () => {
  it('converts Arabic AM/PM labels', () => {
    expect(hourLabelToMinute('7ص')).toBe(7 * 60);
    expect(hourLabelToMinute('9م')).toBe(21 * 60);
    expect(hourLabelToMinute('12م')).toBe(12 * 60); // noon
    expect(hourLabelToMinute('12ص')).toBe(0); // midnight
    expect(hourLabelToMinute('1ص')).toBe(60);
    expect(hourLabelToMinute('1م')).toBe(13 * 60);
  });
  it('rejects non-clock labels', () => {
    expect(hourLabelToMinute('')).toBeNull();
    expect(hourLabelToMinute('13ص')).toBeNull();
    expect(hourLabelToMinute('7pm')).toBeNull();
    expect(hourLabelToMinute('صباحًا')).toBeNull();
  });
});

describe('hoursOpenNow', () => {
  it('opens and closes inside a same-day range', () => {
    expect(hoursOpenNow('⏰ 7ص - 12م', at('05:00'))).toBe(true); // 7:00 Cairo, boundary opens
    expect(hoursOpenNow('⏰ 7ص - 12م', at('09:30'))).toBe(true); // 11:30 Cairo
    expect(hoursOpenNow('⏰ 7ص - 12م', at('10:00'))).toBe(false); // 12:00 Cairo, boundary closes
    expect(hoursOpenNow('⏰ 7ص - 12م', at('04:59'))).toBe(false); // 6:59 Cairo
  });
  it('handles overnight ranges', () => {
    expect(hoursOpenNow('⏰ 9م - 2ص', at('20:00'))).toBe(true); // 22:00 Cairo
    expect(hoursOpenNow('⏰ 9م - 2ص', at('23:30'))).toBe(true); // 1:30 Cairo
    expect(hoursOpenNow('⏰ 9م - 2ص', at('10:00'))).toBe(false); // 12:00 Cairo
  });
  it('treats 24 ساعة and equal ends as always open', () => {
    expect(hoursOpenNow('⏰ 24 ساعة', at('02:00'))).toBe(true);
    expect(hoursOpenNow('⏰ 9ص - 9ص', at('02:00'))).toBe(true);
  });
  it('returns null when the text has no readable hours', () => {
    expect(hoursOpenNow(undefined, at('06:00'))).toBeNull();
    expect(hoursOpenNow('', at('06:00'))).toBeNull();
    expect(hoursOpenNow('طوال اليوم', at('06:00'))).toBeNull();
    expect(hoursOpenNow('⏰ حسب الموسم', at('06:00'))).toBeNull();
  });
});

describe('isShopOpenNow', () => {
  it('manual pause closes even inside the hours', () => {
    expect(isShopOpenNow({ open: false, time: '⏰ 7ص - 12م' }, at('06:00'))).toBe(false);
    expect(isShopOpenNow({ open: false, time: '⏰ 24 ساعة' }, at('06:00'))).toBe(false);
  });
  it('hours close the shop outside the range even when the flag is on', () => {
    expect(isShopOpenNow({ open: true, time: '⏰ 7ص - 12م' }, at('14:00'))).toBe(false); // 16:00 Cairo
  });
  it('opens inside the range when the flag is on', () => {
    expect(isShopOpenNow({ open: true, time: '⏰ 7ص - 12م' }, at('06:00'))).toBe(true);
  });
  it('falls back to the manual flag when hours are unreadable', () => {
    expect(isShopOpenNow({ open: true, time: '' }, at('14:00'))).toBe(true);
    expect(isShopOpenNow({ open: true, time: 'طوال اليوم' }, at('14:00'))).toBe(true);
    expect(isShopOpenNow({ open: false, time: '' }, at('06:00'))).toBe(false);
  });
});
