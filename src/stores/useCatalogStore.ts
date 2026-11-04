// ─── Catalog store: services, shops, providers and shop menus, loaded through the repository
import { create } from 'zustand';
import type { Product, Provider, Service, Shop } from '@/types';
import { getProducts, getProviders, getServices, getShops } from '@/repositories';

type LoadState = 'idle' | 'loading' | 'ready';

/** A shop's list as loaded: 'loading', its products, null (no list), or 'error'. */
export type ShopProducts = 'loading' | Product[] | null | 'error';

interface CatalogState {
  services: Service[];
  shops: Shop[];
  providers: Provider[];
  loadState: LoadState;
  /** Loads once; pass force to reload (pull to refresh, "جرّب تاني"). */
  load: (force?: boolean) => Promise<void>;
  /** What each shop sells, by shop id, loaded when its menu is opened. */
  products: Record<number, ShopProducts>;
  /** Loads a shop's menu once; pass force to try again after an error. */
  loadProducts: (shop: Pick<Shop, 'id' | 'kind'>, force?: boolean) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  services: [],
  shops: [],
  providers: [],
  loadState: 'idle',
  products: {},

  load: async (force = false) => {
    const { loadState } = get();
    if (loadState === 'loading' || (loadState === 'ready' && !force)) return;
    set({ loadState: 'loading' });
    try {
      // Reads fall back to the sample data inside the repository, so this rarely fails
      const [services, shops, providers] = await Promise.all([getServices(), getShops(), getProviders()]);
      set({ services, shops, providers, loadState: 'ready', ...(force ? { products: {} } : {}) });
    } catch (error) {
      console.error('[qaryati] catalog failed to load', error);
      set({ loadState: 'ready' });
    }
  },

  loadProducts: async (shop, force = false) => {
    const current = get().products[shop.id];
    if (current === 'loading' || (current !== undefined && current !== 'error' && !force)) return;
    set((state) => ({ products: { ...state.products, [shop.id]: 'loading' } }));
    let result: ShopProducts;
    try {
      // Falls back to the sample data inside the repository when Supabase is down
      result = await getProducts(shop);
    } catch (error) {
      console.error('[qaryati] menu failed to load', error);
      result = 'error';
    }
    set((state) => ({ products: { ...state.products, [shop.id]: result } }));
  },
}));
