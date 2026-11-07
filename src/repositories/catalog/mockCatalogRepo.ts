// ─── Catalog from the sample data in src/data (no network)
// Demo mode also reflects the provider dashboard's localStorage edits, so what
// a merchant changes on this device shows to customers on this device: closed
// products hide, price/photo changes show, and custom products join the list.
// The bundled sample data (SHOPS/SERVICES/PROVIDERS/catalog products) is demo
// content: showDemo()=false hides it, while records added on this device
// (localStorage) stay — they play the role of real rows, mirroring is_demo.
import { productsForShop } from '@/data/catalog';
import { isDemoMode } from '@/config/demoMode';
import { PROVIDERS } from '@/data/providers';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';
import { useProviderDashboardStore } from '@/stores/useProviderDashboardStore';
import type { Product, Provider, Shop } from '@/types';
import type { CatalogRepo, NewProviderInput, NewShopInput } from './types';

const ADDED_SHOPS_KEY = 'qaryati_mock_added_shops';
const ADDED_PROVIDERS_KEY = 'qaryati_mock_added_providers';

const readAdded = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
};
const writeAdded = <T>(key: string, list: T[]) => localStorage.setItem(key, JSON.stringify(list));

/** Ids of records added from the admin panel start far away from sample data. */
const nextAddedId = (existing: Array<{ id: number }>) =>
  Math.max(900_000, ...existing.map((r) => r.id + 1), 900_000);

export function createMockCatalogRepo(showDemo: () => boolean = isDemoMode): CatalogRepo {
  return {
    getServices: async () => (showDemo() ? SERVICES.filter((service) => !service.hidden) : []),

    getShops: async () => {
      const merchants = useProviderDashboardStore.getState().merchants;
      const withPhoto = (shop: Shop) =>
        merchants[shop.id]?.photo ? { ...shop, photo: merchants[shop.id].photo } : shop;
      return [...(showDemo() ? SHOPS : []).map(withPhoto), ...readAdded<Shop>(ADDED_SHOPS_KEY).map(withPhoto)];
    },

    getProviders: async () => [
      ...(showDemo() ? PROVIDERS.filter((provider) => provider.active) : []),
      ...readAdded<Provider>(ADDED_PROVIDERS_KEY),
    ],

    getProducts: async (shop) => {
      const base = showDemo() ? (productsForShop(shop) ?? []) : [];
      const merchant = useProviderDashboardStore.getState().merchants[shop.id];
      const overridden = base.map((product) => {
        const edit = merchant?.products[product.id];
        if (!edit) return product;
        return {
          ...product,
          price: edit.price ?? product.price,
          photo: edit.photo ?? product.photo,
          available: edit.available,
        };
      });
      // A custom product reaches customers only when it is available AND has
      // a photo: the merchant may save the data now and add the photo later,
      // and it shows itself the moment the photo lands.
      const customs = (merchant?.customProducts ?? [])
        .filter((c) => c.photo)
        .map(
          (c): Product => ({
            id: c.id,
            name: c.name,
            emoji: c.emoji,
            photo: c.photo,
            price: c.price,
            unit: c.unit,
            step: 1,
            section: c.section,
            available:c.available,
          })
        );
      const merged = [...overridden, ...customs];
      return merged.length ? merged : null;
    },

    addShop: async (input: NewShopInput) => {
      const added = readAdded<Shop>(ADDED_SHOPS_KEY);
      const shop: Shop = {
        id: nextAddedId(added),
        name: input.name,
        kind: input.kind,
        emoji: input.emoji || '🏪',
        description: input.description,
        open: true,
        time: input.time || '',
        bgColor: '#ffffff',
      };
      writeAdded(ADDED_SHOPS_KEY, [...added, shop]);
      return shop;
    },

    addProvider: async (input: NewProviderInput) => {
      const added = readAdded<Provider>(ADDED_PROVIDERS_KEY);
      const provider: Provider = {
        id: nextAddedId(added),
        kind: input.kind,
        serviceId: input.serviceId,
        name: input.name,
        gender: input.gender,
        photo: '',
        role: input.role,
        experienceYears: 0,
        rating: 5.0,
        reviews: 0,
        price: input.price,
        numericPrice: null,
        priceType: 'quote',
        area: input.area,
        village: input.village,
        bio: input.bio,
        modes: ['home'],
        active: true,
      };
      writeAdded(ADDED_PROVIDERS_KEY, [...added, provider]);
      return provider;
    },
  };
}
