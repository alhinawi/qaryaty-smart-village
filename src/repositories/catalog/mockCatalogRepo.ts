// ─── Catalog from the sample data in src/data (no network)
import { PROVIDERS } from '@/data/providers';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';
import type { CatalogRepo } from './types';

export function createMockCatalogRepo(): CatalogRepo {
  return {
    getServices: async () => SERVICES.filter((service) => !service.hidden),
    getShops: async () => SHOPS,
    getProviders: async () => PROVIDERS.filter((provider) => provider.active),
  };
}
