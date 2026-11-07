import { describe, expect, it } from 'vitest';
import { countdownText, isOfferActive } from './countdown';

const NOW = new Date('2026-11-07T12:00:00Z').getTime();
const inMs = (ms: number) => new Date(NOW + ms).toISOString();

describe('countdownText', () => {
  it('says خلص when over', () => {
    expect(countdownText(inMs(-1000), NOW)).toBe('خلص');
  });
  it('minutes only under an hour', () => {
    expect(countdownText(inMs(45 * 60000), NOW)).toBe('فاضل 45 دقيقة');
    expect(countdownText(inMs(2 * 60000), NOW)).toBe('فاضل دقيقتين');
    expect(countdownText(inMs(5 * 60000), NOW)).toBe('فاضل 5 دقائق');
  });
  it('hours and minutes', () => {
    expect(countdownText(inMs(3 * 3600000), NOW)).toBe('فاضل 3 ساعات');
    expect(countdownText(inMs(2 * 3600000), NOW)).toBe('فاضل ساعتين');
    expect(countdownText(inMs(2 * 3600000 + 15 * 60000), NOW)).toBe('فاضل ساعتين و15 دقيقة');
  });
});

describe('isOfferActive', () => {
  it('flips at the end time', () => {
    expect(isOfferActive(inMs(1000), NOW)).toBe(true);
    expect(isOfferActive(inMs(-1000), NOW)).toBe(false);
  });
});
