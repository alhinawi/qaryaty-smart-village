import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  canRenew,
  daysLeft,
  filterListings,
  formatPrice,
  isLive,
  listingWhatsappLink,
  ownerStatusLabel,
  parsePrice,
  timeAgo,
  validateListingDraft,
} from './market';
import type { ListingDraft, MarketListing } from '@/repositories/market/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-06T12:00:00Z');

const sale: ListingDraft = {
  kind: 'sale',
  title: 'تلاجة شارب',
  category: 'devices',
  condition: 'good',
  village: 'منية سندوب',
  description: '',
  price: 3500,
  negotiable: true,
  wanted: '',
  photos: [],
  showPhone: false,
  contactPhone: '',
};
const swap: ListingDraft = { ...sale, kind: 'swap', price: null, negotiable: false, wanted: 'بوتاجاز' };

function listing(over: Partial<MarketListing> = {}): MarketListing {
  return {
    id: 'l1',
    ownerId: 'u1',
    ownerName: 'محمد',
    kind: 'sale',
    title: 'تلاجة شارب',
    category: 'devices',
    condition: 'good',
    village: 'منية سندوب',
    description: 'نضيفة جدًا',
    price: 3500,
    negotiable: false,
    wanted: '',
    photos: [],
    photoPaths: [],
    contactPhone: null,
    status: 'active',
    reportsCount: 0,
    expiresAt: new Date(NOW + 20 * DAY).toISOString(),
    createdAt: new Date(NOW - DAY).toISOString(),
    ...over,
  };
}

describe('market post form', () => {
  it('accepts a complete sale and a complete swap', () => {
    expect(validateListingDraft(sale)).toEqual({});
    expect(validateListingDraft(swap)).toEqual({});
  });

  it('needs a price for a sale and what a swap wants', () => {
    expect(validateListingDraft({ ...sale, price: null }).price).toBeTruthy();
    expect(validateListingDraft({ ...sale, price: 0 }).price).toBeTruthy();
    expect(validateListingDraft({ ...sale, price: 12.5 }).price).toBeTruthy();
    expect(validateListingDraft({ ...sale, price: 50_000_001 }).price).toBeTruthy();
    expect(validateListingDraft({ ...swap, wanted: ' ' }).wanted).toBeTruthy();
    // A swap has no price to check
    expect(validateListingDraft({ ...swap, price: null }).price).toBeUndefined();
  });

  it('checks title, category, condition, village, photos and phone', () => {
    const e = validateListingDraft({
      ...sale,
      title: ' تل ',
      category: '',
      condition: '',
      village: ' ',
      photos: ['a', 'b', 'c', 'd', 'e', 'f'],
      showPhone: true,
      contactPhone: '0123',
    });
    expect(Object.keys(e).sort()).toEqual(['category', 'condition', 'contactPhone', 'photos', 'title', 'village']);
    expect(validateListingDraft({ ...sale, title: 'x'.repeat(81) }).title).toBeTruthy();
    expect(validateListingDraft({ ...sale, showPhone: true, contactPhone: '01012345678' })).toEqual({});
  });

  it('reads prices typed with Arabic digits, commas or spaces', () => {
    expect(parsePrice('3500')).toBe(3500);
    expect(parsePrice('٣٥٠٠')).toBe(3500);
    expect(parsePrice('3,500')).toBe(3500);
    expect(parsePrice('٣٬٥٠٠')).toBe(3500);
    expect(parsePrice(' 12 000 ')).toBe(12000);
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('مجانًا')).toBeNull();
    expect(parsePrice('-5')).toBeNull();
  });

  it('writes prices with a thousands comma', () => {
    expect(formatPrice(3500)).toBe('3,500 جنيه');
  });
});

describe('market post life', () => {
  it('is live while active and not expired', () => {
    expect(isLive(listing(), NOW)).toBe(true);
    expect(isLive(listing({ status: 'sold' }), NOW)).toBe(false);
    expect(isLive(listing({ expiresAt: new Date(NOW - 1).toISOString() }), NOW)).toBe(false);
  });

  it('opens renew in the last 7 days and after it ends', () => {
    expect(canRenew(listing({ expiresAt: new Date(NOW + 8 * DAY).toISOString() }), NOW)).toBe(false);
    expect(canRenew(listing({ expiresAt: new Date(NOW + 7 * DAY).toISOString() }), NOW)).toBe(true);
    expect(canRenew(listing({ expiresAt: new Date(NOW - DAY).toISOString() }), NOW)).toBe(true);
    expect(canRenew(listing({ status: 'hidden', expiresAt: new Date(NOW + DAY).toISOString() }), NOW)).toBe(false);
  });

  it('tells the owner where the post stands', () => {
    expect(ownerStatusLabel(listing(), NOW)).toBe('منشور • فاضل 20 يوم');
    expect(daysLeft(listing({ expiresAt: new Date(NOW + DAY / 2).toISOString() }), NOW)).toBe(0);
    expect(ownerStatusLabel(listing({ expiresAt: new Date(NOW + DAY / 2).toISOString() }), NOW)).toBe('آخر يوم ليه');
    expect(ownerStatusLabel(listing({ status: 'sold' }), NOW)).toBe('اتباع');
    expect(ownerStatusLabel(listing({ kind: 'swap', status: 'swapped' }), NOW)).toBe('اتبدّل');
    expect(ownerStatusLabel(listing({ status: 'hidden' }), NOW)).toContain('الإدارة');
    expect(ownerStatusLabel(listing({ expiresAt: new Date(NOW - 1).toISOString() }), NOW)).toBe('خلصت مدته');
  });

  it('says how old a post is', () => {
    expect(timeAgo(new Date(NOW - 30_000).toISOString(), NOW)).toBe('دلوقتي');
    expect(timeAgo(new Date(NOW - 2 * 3600_000).toISOString(), NOW)).toBe('من ساعتين');
    expect(timeAgo(new Date(NOW - DAY - 1000).toISOString(), NOW)).toBe('امبارح');
  });
});

describe('market filters and contact', () => {
  const list = [
    listing({ id: 'a', price: 500, category: 'phones', title: 'موبايل سامسونج', village: 'بدواي' }),
    listing({ id: 'b', price: 5000 }),
    listing({ id: 'c', kind: 'swap', price: null, wanted: 'عجلة أطفال', category: 'kids', title: 'سرير أطفال' }),
  ];
  const ids = (f: Partial<typeof EMPTY_FILTERS>) => filterListings(list, { ...EMPTY_FILTERS, ...f }).map((l) => l.id);

  it('filters by village, category, price and Arabic-aware search', () => {
    expect(ids({})).toEqual(['a', 'b', 'c']);
    expect(ids({ village: 'بدواي' })).toEqual(['a']);
    expect(ids({ category: 'kids' })).toEqual(['c']);
    expect(ids({ minPrice: 1000 })).toEqual(['b', 'c']);
    expect(ids({ maxPrice: 1000 })).toEqual(['a', 'c']);
    expect(ids({ search: 'موبايل' })).toEqual(['a']);
    // What a swap wants is searchable too
    expect(ids({ search: 'عجله' })).toEqual(['c']);
  });

  it('opens WhatsApp on the owner with an Egyptian number and a first line', () => {
    const link = listingWhatsappLink('01012345678', { title: 'تلاجة', kind: 'sale' });
    expect(link.startsWith('https://wa.me/201012345678?text=')).toBe(true);
    expect(decodeURIComponent(link.split('text=')[1])).toContain('"تلاجة"');
  });
});
