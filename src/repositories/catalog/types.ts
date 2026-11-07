// ─── Catalog repository: services, shops and providers customers can see
import type { Gender, Product, Provider, ProviderKind, Service, Shop, ShopKind } from '@/types';

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
  getProducts(shop: Pick<Shop, 'id' | 'kind' | 'demo'> & Partial<Pick<Shop, 'name'>>): Promise<Product[] | null>;
  /** Admin panel: a new shop, optionally linked to the account that manages it. */
  addShop(input: NewShopInput): Promise<Shop>;
  /** Admin panel: a new professional (سباك، مدرس…), optionally linked to an account. */
  addProvider(input: NewProviderInput): Promise<Provider>;
}

export interface NewShopInput {
  name: string;
  kind: ShopKind;
  emoji?: string;
  description: string;
  time?: string;
  /** Account that manages the shop from its dashboard. Needs the provider-accounts migration. */
  ownerProfileId?: string;
}

export interface NewProviderInput {
  name: string;
  kind: ProviderKind;
  serviceId: number;
  gender: Gender;
  /** What they do as shown on the card (سباك، كهربائي، مدرس لغة عربية). */
  role: string;
  village: string;
  area: string;
  price: string;
  bio: string;
  ownerProfileId?: string;
}
