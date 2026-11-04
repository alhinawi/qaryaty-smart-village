import { describe, expect, it } from 'vitest';
import { SERVICES } from '@/data/services';
import { createMockCatalogRepo } from './mockCatalogRepo';
import { providerFromRow, serviceFromRow, shopFromRow } from './supabaseCatalogRepo';

describe('mock catalog repo', () => {
  it('returns the sample services without hidden ones', async () => {
    const services = await createMockCatalogRepo().getServices();
    expect(services.length).toBe(SERVICES.filter((s) => !s.hidden).length);
    expect(services.every((s) => !s.hidden)).toBe(true);
  });
});

describe('supabase row mapping', () => {
  it('maps snake_case rows to the app types', () => {
    const service = serviceFromRow({
      id: 1, cat: 'edu', emoji: '📚', name: 'مدرس عربي', description: 'حصص', time: 'بالحصة',
      price: 'من 50 ج', numeric_price: 50, price_type: 'from', rating: '4.9', badge: null,
      featured: false, subject: 'arabic', options: [], hidden: false,
    });
    expect(service).toMatchObject({ desc: 'حصص', numericPrice: 50, priceType: 'from', badge: '', subject: 'arabic' });
    expect(service.options).toBeUndefined();

    expect(shopFromRow({ id: 2, emoji: '🛒', name: 'بقالة', description: 'x', open: true, time: '24 ساعة', bg_color: '#fff' }).bgColor).toBe('#fff');

    const provider = providerFromRow({
      id: 3, kind: 'nurse', service_id: 9, name: 'م. سارة', gender: 'female', photo: null, subject: null,
      stages: null, specialty: null, experience_years: 5, rating: 4.7, reviews: 10, price: '150 ج',
      numeric_price: 150, price_type: 'fixed', area: 'البركة', bio: 'حقن وغيار', modes: ['home'], active: true,
    });
    expect(provider).toMatchObject({ serviceId: 9, experienceYears: 5, photo: '' });
    expect(provider.stages).toBeUndefined();
  });
});
