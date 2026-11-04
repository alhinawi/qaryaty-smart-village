import { describe, expect, it } from 'vitest';
import { PROVIDERS } from './providers';
import { SERVICES } from './services';
import { providerToOrderModalData } from '@/utils/pricing';

describe('providers sample data', () => {
  it('ids are unique and every provider points to a real service', () => {
    expect(new Set(PROVIDERS.map((p) => p.id)).size).toBe(PROVIDERS.length);
    const serviceIds = new Set(SERVICES.map((s) => s.id));
    for (const provider of PROVIDERS) expect(serviceIds.has(provider.serviceId)).toBe(true);
  });

  it('teachers have a subject; school subjects also list their stages', () => {
    for (const teacher of PROVIDERS.filter((p) => p.kind === 'teacher')) {
      expect(teacher.subject).toBeDefined();
      // Quran teachers have no stages: they teach all ages
      if (teacher.subject !== 'quran') expect(teacher.stages?.length).toBeGreaterThan(0);
    }
  });

  it('booking a provider keeps the provider and service ids on the order', () => {
    const provider = PROVIDERS[0];
    const service = SERVICES.find((s) => s.id === provider.serviceId);
    const data = providerToOrderModalData(provider, service);
    expect(data.providerId).toBe(provider.id);
    expect(data.serviceId).toBe(provider.serviceId);
    expect(data.name).toContain(provider.name);
  });
});
