import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { HERO_SLIDES } from './heroSlides';
import { SERVICES } from '@/data/services';

describe('service-specific home carousel', () => {
  it('contains twelve distinct services, real service IDs, copy and matching local artwork', () => {
    expect(HERO_SLIDES).toHaveLength(12);
    expect(new Set(HERO_SLIDES.map(slide => slide.serviceId)).size).toBe(12);
    for (const slide of HERO_SLIDES) {
      expect(SERVICES.some(service => service.id === slide.serviceId)).toBe(true);
      expect(slide.eyebrow.length).toBeGreaterThan(0);
      expect(slide.cta.length).toBeGreaterThan(0);
      expect(existsSync(`public/img/home-refresh/banner-${slide.id}.webp`)).toBe(true);
    }
  });
});
