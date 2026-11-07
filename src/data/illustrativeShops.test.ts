import { describe, expect, it } from 'vitest';
import { ILLUSTRATIVE_SHOPS, appendIllustrativeShops } from './illustrativeShops';
import { SHOPS } from './shops';
import { productsForShop } from './catalog';
import { interleaveShops } from '@/utils/interleaveShops';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

describe('illustrative spice and stationery shops', () => {
  it('adds eight of each, separate identities and images, display-only', () => {
    for (const kind of ['attar', 'stationery']) {
      const rows = ILLUSTRATIVE_SHOPS.filter(s => s.kind === kind);
      expect(rows).toHaveLength(8);
      expect(SHOPS.filter(s => s.kind === kind)).toHaveLength(9);
      expect(rows.every(s => s.id < 0 && s.demo && s.time === 'للعرض فقط' && !s.name.includes('تجريبية'))).toBe(true);
      expect(rows.every(s => (productsForShop(s)?.length ?? 0) > 0)).toBe(true);
    }
    expect(new Set(ILLUSTRATIVE_SHOPS.map(s => s.id)).size).toBe(16);
    expect(new Set(ILLUSTRATIVE_SHOPS.map(s => createHash('sha256').update(readFileSync(`public${s.photo}`)).digest('hex'))).size).toBe(16);
  });
  it('never replaces an existing record and never duplicates examples', () => {
    const real = { ...ILLUSTRATIVE_SHOPS[0], demo: undefined, name: 'owned shop', photo: '/upload.webp' };
    const result = appendIllustrativeShops([real]);
    expect(result[0]).toBe(real);
    expect(appendIllustrativeShops(result)).toEqual(result);
  });
  it('mixes all-shop categories with no neighboring repeats, without mutation', () => {
    const source = SHOPS.filter(s => s.kind !== 'restaurant');
    const before = [...source];
    const result = interleaveShops(source);
    expect(source).toEqual(before);
    expect(new Set(result.map(s => s.id))).toEqual(new Set(source.map(s => s.id)));
    expect(result.slice(1).every((s, i) => s.kind !== result[i].kind)).toBe(true);
    expect(interleaveShops(source)).toEqual(result);
    expect(interleaveShops([])).toEqual([]);
    expect(interleaveShops(source.filter(s => s.kind === 'attar'))).toHaveLength(9);
  });
});
