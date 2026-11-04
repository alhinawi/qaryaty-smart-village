import { describe, expect, it } from 'vitest';
import { matchesSearch, normalizeArabic } from './arabicSearch';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';

describe('normalizeArabic', () => {
  it('drops tashkeel and tatweel', () => {
    expect(normalizeArabic('مُدَرِّسٌ')).toBe('مدرس');
    expect(normalizeArabic('ســباك')).toBe('سباك');
  });

  it('unifies alef forms, taa marbuta and alef maqsura', () => {
    expect(normalizeArabic('أإآا')).toBe('اااا');
    expect(normalizeArabic('جزارة')).toBe(normalizeArabic('جزاره'));
    expect(normalizeArabic('مستشفى')).toBe(normalizeArabic('مستشفي'));
  });

  it('lowercases latin text and Arabic digits', () => {
    expect(normalizeArabic('Baby  Sitter ١٢')).toBe('baby sitter 12');
  });
});

describe('matchesSearch', () => {
  it('matches regardless of hamza or tashkeel', () => {
    expect(matchesSearch('اكل', ['أكل بيتي'])).toBe(true);
    expect(matchesSearch('أَكْل', ['اكل بيتي'])).toBe(true);
  });

  it('needs every word, in any field', () => {
    expect(matchesSearch('عيش طازج', ['عيش من الفرن', 'عيش بلدي طازج'])).toBe(true);
    expect(matchesSearch('عيش سمك', ['عيش من الفرن'])).toBe(false);
  });

  it('empty query matches everything', () => {
    expect(matchesSearch('   ', ['أي حاجة'])).toBe(true);
  });

  it('finds real services and shops', () => {
    const service = SERVICES.find((s) => matchesSearch('اكل بيتي', [s.name, s.desc]));
    expect(service?.name).toBe('أكل بيتي');
    const shop = SHOPS.find((s) => matchesSearch('فرن الاصيل', [s.name, s.description]));
    expect(shop?.name).toBe('فرن الأصيل');
  });
});
