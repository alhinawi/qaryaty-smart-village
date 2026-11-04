// ─── Catalog repository: services, shops and providers customers can see
import type { Provider, Service, Shop } from '@/types';

export interface CatalogRepo {
  /** Visible services only (hidden ones are left out). */
  getServices(): Promise<Service[]>;
  getShops(): Promise<Shop[]>;
  /** Active providers only. */
  getProviders(): Promise<Provider[]>;
}
