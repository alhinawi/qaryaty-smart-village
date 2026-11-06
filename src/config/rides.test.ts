import { describe, expect, it } from 'vitest';
import {
  EMPTY_RIDE_FILTERS,
  RIDE_SEARCH_WORDS,
  canRenewRide,
  filterRides,
  hasRideFilters,
  isRideLive,
  priceLabel,
  rideVillages,
  rideWhatsappLink,
  runsOn,
  scheduleLabel,
  seatsLabel,
  seatsLeft,
  timeLabel,
} from './rides';
import { matchesSearch } from '@/utils/arabicSearch';
import type { Ride } from '@/repositories/rides/types';

const DAY = 24 * 60 * 60 * 1000;
// Friday 6 November 2026, noon in Cairo
const NOW = Date.parse('2026-11-06T10:00:00Z');

function ride(over: Partial<Ride> = {}): Ride {
  return {
    id: 'r1',
    ownerId: 'u1',
    ownerName: 'محمد عاطف',
    kind: 'car',
    fromVillage: 'منية سندوب',
    toPlace: 'المنصورة',
    departTime: '07:30',
    returnTime: '',
    schedule: 'daily',
    days: [],
    rideDate: '',
    seats: 3,
    price: 10,
    carType: '',
    notes: '',
    riders: 'any',
    phone: '01012345678',
    whatsapp: true,
    seatsTaken: 0,
    status: 'active',
    reportsCount: 0,
    expiresAt: new Date(NOW + 20 * DAY).toISOString(),
    createdAt: new Date(NOW).toISOString(),
    updatedAt: new Date(NOW).toISOString(),
    ...over,
  };
}

describe('ride sharing: search words', () => {
  it('finds the service for the words people type', () => {
    for (const q of ['مواصلات', 'شير', 'توصيلة', 'عربية', 'عربيه']) {
      expect(matchesSearch(q, RIDE_SEARCH_WORDS), q).toBe(true);
    }
    expect(matchesSearch('سباك', RIDE_SEARCH_WORDS)).toBe(false);
  });
});

describe('ride sharing: labels', () => {
  it('reads times the Egyptian way', () => {
    expect(timeLabel('07:30')).toBe('7:30 الصبح');
    expect(timeLabel('15:00')).toBe('3 العصر');
    expect(timeLabel('20:00')).toBe('8 بالليل');
  });

  it('says how many seats are left, and full when none', () => {
    expect(seatsLeft(ride({ seats: 3, seatsTaken: 1 }))).toBe(2);
    expect(seatsLabel(ride({ seats: 3, seatsTaken: 1 }))).toBe('كرسيين فاضيين');
    expect(seatsLabel(ride({ kind: 'taxi', seats: 2 }))).toBe('عايز اتنين كمان');
    expect(seatsLabel(ride({ seats: 2, seatsTaken: 2 }))).toBe('اكتمل');
  });

  it('shows the token price, free, or an equal split', () => {
    expect(priceLabel(ride({ price: 10 }))).toBe('10 جنيه للكرسي');
    expect(priceLabel(ride({ price: 0 }))).toBe('ببلاش');
    expect(priceLabel(ride({ kind: 'taxi', price: null }))).toBe('الأجرة بالتساوي');
  });

  it('names the days', () => {
    expect(scheduleLabel(ride({ schedule: 'weekdays' }))).toBe('من الحد للخميس');
    expect(scheduleLabel(ride({ schedule: 'once', rideDate: '2026-11-07' }), NOW)).toContain('بكرة');
  });

  it('opens WhatsApp on the poster with an Egyptian number and a ready message', () => {
    const link = rideWhatsappLink(ride());
    expect(link.startsWith('https://wa.me/201012345678?text=')).toBe(true);
    expect(decodeURIComponent(link)).toContain('المنصورة');
  });
});

describe('ride sharing: which days a trip runs', () => {
  it('Sunday to Thursday skips Friday and Saturday', () => {
    expect(runsOn(ride({ schedule: 'weekdays' }), '2026-11-08')).toBe(true); // Sunday
    expect(runsOn(ride({ schedule: 'weekdays' }), '2026-11-06')).toBe(false); // Friday
  });
  it('chosen days and one-off dates', () => {
    expect(runsOn(ride({ schedule: 'days', days: [5] }), '2026-11-06')).toBe(true);
    expect(runsOn(ride({ schedule: 'days', days: [1] }), '2026-11-06')).toBe(false);
    expect(runsOn(ride({ schedule: 'once', rideDate: '2026-11-06' }), '2026-11-06')).toBe(true);
    expect(runsOn(ride({ schedule: 'once', rideDate: '2026-11-07' }), '2026-11-06')).toBe(false);
  });
});

describe('ride sharing: life of a post', () => {
  it('is live only while active and not ended', () => {
    expect(isRideLive(ride(), NOW)).toBe(true);
    expect(isRideLive(ride({ status: 'paused' }), NOW)).toBe(false);
    expect(isRideLive(ride({ expiresAt: new Date(NOW - 1000).toISOString() }), NOW)).toBe(false);
  });
  it('renews in the last 7 days only, never one-offs or hidden posts', () => {
    expect(canRenewRide(ride(), NOW)).toBe(false);
    expect(canRenewRide(ride({ expiresAt: new Date(NOW + 5 * DAY).toISOString() }), NOW)).toBe(true);
    expect(canRenewRide(ride({ schedule: 'once', expiresAt: new Date(NOW + DAY).toISOString() }), NOW)).toBe(false);
    expect(canRenewRide(ride({ status: 'hidden', expiresAt: new Date(NOW + DAY).toISOString() }), NOW)).toBe(false);
  });
});

describe('ride sharing: filters', () => {
  const rides = [
    ride({ id: 'a', kind: 'taxi', departTime: '06:30', riders: 'women', schedule: 'weekdays' }),
    ride({ id: 'b', kind: 'car', departTime: '08:00', toPlace: 'جامعة المنصورة' }),
    ride({ id: 'c', kind: 'car', departTime: '15:00', fromVillage: 'بلقاس', schedule: 'once', rideDate: '2026-11-06' }),
  ];
  const ids = (list: Ride[]) => list.map((r) => r.id);

  it('no filters keeps everything', () => {
    expect(ids(filterRides(rides, EMPTY_RIDE_FILTERS, NOW))).toEqual(['a', 'b', 'c']);
    expect(hasRideFilters(EMPTY_RIDE_FILTERS)).toBe(false);
  });
  it('by kind, time of day, women only, village and place', () => {
    expect(ids(filterRides(rides, { ...EMPTY_RIDE_FILTERS, kind: 'taxi' }, NOW))).toEqual(['a']);
    expect(ids(filterRides(rides, { ...EMPTY_RIDE_FILTERS, window: 'early' }, NOW))).toEqual(['a']);
    expect(ids(filterRides(rides, { ...EMPTY_RIDE_FILTERS, window: 'afternoon' }, NOW))).toEqual(['c']);
    expect(ids(filterRides(rides, { ...EMPTY_RIDE_FILTERS, womenOnly: true }, NOW))).toEqual(['a']);
    expect(ids(filterRides(rides, { ...EMPTY_RIDE_FILTERS, village: 'بلقاس' }, NOW))).toEqual(['c']);
    expect(ids(filterRides(rides, { ...EMPTY_RIDE_FILTERS, query: 'جامعه' }, NOW))).toEqual(['b']);
  });
  it('طالعين النهارده drops trips that do not run today (a Friday)', () => {
    expect(ids(filterRides(rides, { ...EMPTY_RIDE_FILTERS, today: true }, NOW))).toEqual(['b', 'c']);
  });
  it('lists villages with the most trips first', () => {
    expect(rideVillages(rides)).toEqual(['منية سندوب', 'بلقاس']);
  });
});
