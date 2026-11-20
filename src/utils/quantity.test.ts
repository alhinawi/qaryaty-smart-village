import { describe, expect, it } from 'vitest';
import { BAKERY, CATALOG_BY_KIND } from '@/data/catalog';
import {
  MAX_LINE_QUANTITY,
  clampQuantity,
  formatQuantity,
  formatQuantityNumber,
  parseQuantity,
  quickQuantities,
} from './quantity';

describe('quickQuantities', () => {
  it('offers bread by the 5s and 10s', () => {
    expect(quickQuantities('رغيف', 1)).toEqual([5, 10, 20, 25, 50]);
  });

  it('offers kilos sold by the half in halves', () => {
    expect(quickQuantities('كيلو', 0.5)).toEqual([0.5, 1, 2, 3, 5]);
  });

  it('offers whole kilos without a half', () => {
    expect(quickQuantities('كيلو', 1)).not.toContain(0.5);
  });

  it('offers a quarter-kilo item up to two kilos', () => {
    expect(quickQuantities('ربع كيلو', 1)).toEqual([1, 2, 4, 8]);
  });

  it('offers medicine a few at a time', () => {
    expect(quickQuantities('علبة (٢٠ قرص)', 1)).toEqual([1, 2, 3]);
  });

  it('offers pieces 1 to 10', () => {
    expect(quickQuantities('قطعة', 1)).toEqual([1, 2, 3, 5, 10]);
  });

  it('gives every product in every shop at least three choices, all allowed by its step', () => {
    for (const products of Object.values(CATALOG_BY_KIND)) {
      for (const p of products ?? []) {
        const step = p.step ?? 1;
        const choices = quickQuantities(p.unit, step);
        expect(choices.length, p.name).toBeGreaterThanOrEqual(3);
        for (const q of choices) {
          expect(q).toBeLessThanOrEqual(MAX_LINE_QUANTITY);
          expect(Number.isInteger(q / step), `${p.name} ${q}`).toBe(true);
        }
      }
    }
  });

  it('gives the bakery’s loaves the bread choices', () => {
    const loaf = BAKERY.find((p) => p.unit === 'رغيف');
    expect(loaf).toBeDefined();
    expect(quickQuantities(loaf!.unit, loaf!.step)).toContain(10);
  });
});

describe('parseQuantity', () => {
  it('reads Arabic and English digits', () => {
    expect(parseQuantity('٢٥')).toBe(25);
    expect(parseQuantity(' 12 ')).toBe(12);
    expect(parseQuantity('۱۵')).toBe(15);
  });

  it('reads fractions and نص', () => {
    expect(parseQuantity('١٫٥')).toBe(1.5);
    expect(parseQuantity('2,5')).toBe(2.5);
    expect(parseQuantity('نص')).toBe(0.5);
    expect(parseQuantity('٢ ونص')).toBe(2.5);
  });

  it('rejects what is not a number above zero', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('عشرة')).toBeNull();
    expect(parseQuantity('0')).toBeNull();
    expect(parseQuantity('-3')).toBeNull();
    expect(parseQuantity('1e3')).toBeNull();
  });
});

describe('clampQuantity', () => {
  it('rounds to the step and keeps within one step and the maximum', () => {
    expect(clampQuantity(2.3, 0.5)).toBe(2.5);
    expect(clampQuantity(7.4, 1)).toBe(7);
    expect(clampQuantity(0.2, 1)).toBe(1);
    expect(clampQuantity(500, 1)).toBe(MAX_LINE_QUANTITY);
    expect(clampQuantity(500, 0.5)).toBe(MAX_LINE_QUANTITY);
  });
});

describe('formatQuantity', () => {
  it('reads in Arabic digits, halves as نص', () => {
    expect(formatQuantity(10, 'رغيف')).toBe('١٠ رغيف');
    expect(formatQuantity(0.5, 'كيلو')).toBe('نص كيلو');
    expect(formatQuantity(1.5, 'كيلو')).toBe('١ ونص كيلو');
    expect(formatQuantityNumber(25)).toBe('٢٥');
  });
});
