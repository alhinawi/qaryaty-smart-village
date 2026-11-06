import { describe, expect, it } from 'vitest';
import { rideFormSchema } from './rideForm';

// Friday 6 November 2026, noon in Cairo
const NOW = Date.parse('2026-11-06T10:00:00Z');

const base = {
  kind: 'car' as const,
  fromVillage: 'منية سندوب',
  toPlace: 'المنصورة',
  departTime: '07:30',
  returnTime: '15:00',
  schedule: 'weekdays' as const,
  days: [] as number[],
  rideDate: '',
  seats: 3,
  price: 10 as number | null,
  carType: 'فيرنا',
  notes: '',
  riders: 'any' as const,
  phone: '01012345678',
  whatsapp: true,
};

function errors(over: Partial<typeof base> | Record<string, unknown>) {
  const r = rideFormSchema(NOW).safeParse({ ...base, ...over });
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

describe('ride form', () => {
  it('accepts a normal car offer and a taxi share with an equal split', () => {
    expect(errors({})).toEqual([]);
    expect(errors({ kind: 'taxi', seats: 2, price: null })).toEqual([]);
  });

  it('a car needs a token price, at most 100 per seat; 0 means free', () => {
    expect(errors({ price: null })).toContain('price');
    expect(errors({ price: 101 })).toContain('price');
    expect(errors({ price: 100 })).toEqual([]);
    expect(errors({ price: 0 })).toEqual([]);
  });

  it('a taxi takes 3 others at most, a car 6', () => {
    expect(errors({ kind: 'taxi', seats: 4, price: null })).toContain('seats');
    expect(errors({ seats: 6 })).toEqual([]);
    expect(errors({ seats: 7 })).toContain('seats');
  });

  it('chosen days need at least one day', () => {
    expect(errors({ schedule: 'days', days: [] })).toContain('days');
    expect(errors({ schedule: 'days', days: [0, 2] })).toEqual([]);
  });

  it('a one-off trip is from today up to 30 days ahead', () => {
    expect(errors({ schedule: 'once', rideDate: '2026-11-06' })).toEqual([]);
    expect(errors({ schedule: 'once', rideDate: '2026-12-06' })).toEqual([]);
    expect(errors({ schedule: 'once', rideDate: '2026-11-05' })).toContain('rideDate');
    expect(errors({ schedule: 'once', rideDate: '2026-12-07' })).toContain('rideDate');
  });

  it('checks the times and the phone', () => {
    expect(errors({ departTime: '' })).toContain('departTime');
    expect(errors({ returnTime: '07:30' })).toContain('returnTime');
    expect(errors({ returnTime: '' })).toEqual([]);
    expect(errors({ phone: '12345' })).toContain('phone');
  });
});
