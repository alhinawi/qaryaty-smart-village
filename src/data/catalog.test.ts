import { describe, expect, it } from 'vitest';
import { CATEGORIES } from './categories';
import { SERVICES } from './services';
import { SHOPS } from './shops';
import { matchesSearch } from '@/utils/arabicSearch';
import { getOrderPricing } from '@/utils/pricing';

describe('catalog data', () => {
  it('service and shop ids are unique', () => {
    expect(new Set(SERVICES.map((s) => s.id)).size).toBe(SERVICES.length);
    expect(new Set(SHOPS.map((s) => s.id)).size).toBe(SHOPS.length);
  });

  it('every service belongs to a category in the categories row', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const service of SERVICES) expect(ids.has(service.cat)).toBe(true);
  });

  it('every order choice has at least two options', () => {
    for (const service of SERVICES) {
      for (const option of service.options ?? []) {
        expect(option.choices.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('prices follow the price model', () => {
    for (const service of SERVICES) {
      const pricing = getOrderPricing(service, false);
      if (service.priceType === 'quote') expect(pricing.finalPrice).toBeNull();
      if (service.priceType === 'from') expect(pricing.isEstimate).toBe(true);
    }
  });

  it.each([
    ['مدرس انجليزي', 'مدرس إنجليزي'],
    ['ممرضه', 'تمريض منزلي (ممرض / ممرضة)'],
    ['جزاره', 'جزارة'],
    ['مكواه', 'غسيل ومكواة'],
    ['baby sitter', 'جليسة أطفال (Baby sitter)'],
    ['دكتور', 'دكتور (كشف في البيت أو العيادة)'],
    ['نظافه', 'عامل / عاملة نظافة'],
  ])('search "%s" finds %s', (query, name) => {
    const names = SERVICES.filter((s) => matchesSearch(query, [s.name, s.desc])).map((s) => s.name);
    expect(names).toContain(name);
  });

  it('butcher shop is searchable', () => {
    expect(SHOPS.some((s) => matchesSearch('جزاره', [s.name, s.description]))).toBe(true);
  });
});
