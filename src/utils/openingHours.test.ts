import { describe, expect, it } from 'vitest';
import { formatOpeningHours, HOUR_OPTIONS, parseOpeningHours } from './openingHours';

describe('opening hours', () => {
  it('parses the stored range format', () => {
    expect(parseOpeningHours('⏰ 7ص - 12م')).toEqual({ allDay: false, from: '7ص', to: '12م' });
    expect(parseOpeningHours('⏰ 12م - 2ص')).toEqual({ allDay: false, from: '12م', to: '2ص' });
  });

  it('parses the 24-hours format', () => {
    expect(parseOpeningHours('⏰ 24 ساعة').allDay).toBe(true);
  });

  it('falls back to a default for text it does not know', () => {
    expect(parseOpeningHours('⏰ يفتح 2م')).toEqual({ allDay: false, from: '9ص', to: '9م' });
  });

  it('composes the exact stored format back', () => {
    expect(formatOpeningHours({ allDay: false, from: '7ص', to: '12م' })).toBe('⏰ 7ص - 12م');
    expect(formatOpeningHours({ allDay: true, from: '7ص', to: '12م' })).toBe('⏰ 24 ساعة');
  });

  it('round-trips every offered hour', () => {
    for (const h of HOUR_OPTIONS) {
      expect(parseOpeningHours(formatOpeningHours({ allDay: false, from: h, to: h })).from).toBe(h);
    }
  });
});
