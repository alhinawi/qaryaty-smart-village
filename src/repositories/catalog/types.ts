// ─── Catalog repository: services, shops and providers customers can see
import type { Product, Provider, Service, Shop } from '@/types';

export interface CatalogRepo {
  /** Visible services only (hidden ones are left out). */
  getServices(): Promise<Service[]>;
  getShops(): Promise<Shop[]>;
  /** Active providers only. */
  getProviders(): Promise<Provider[]>;
  /**
   * What a shop sells, in menu order: a restaurant's own menu, or its kind's
   * list (fish, butcher…). null when the shop has no list (a salon, a workshop).
   */
  getProducts(shop: Pick<Shop, 'id' | 'kind'>): Promise<Product[] | null>;
}
