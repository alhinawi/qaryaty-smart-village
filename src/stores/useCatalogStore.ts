// ─── Catalog store: services, shops and providers, loaded through the repository
import { create } from 'zustand';
import type { Provider, Service, Shop } from '@/types';
import { getProviders, getServices, getShops } from '@/repositories';

type LoadState = 'idle' | 'loading' | 'ready';

interface CatalogState {
  services: Service[];
  shops: Shop[];
  providers: Provider[];
  loadState: LoadState;
  /** Loads once; pass force to reload (pull to refresh, "جرّب تاني"). */
  load: (force?: boolean) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  services: [],
  shops: [],
  providers: [],
  loadState: 'idle',

  load: async (force = false) => {
    const { loadState } = get();
    if (loadState === 'loading' || (loadState === 'ready' && !force)) return;
    set({ loadState: 'loading' });
    try {
      // Reads fall back to the sample data inside the repository, so this rarely fails
      const [services, shops, providers] = await Promise.all([getServices(), getShops(), getProviders()]);
      set({ services, shops, providers, loadState: 'ready' });
    } catch (error) {
      console.error('[qaryati] catalog failed to load', error);
      set({ loadState: 'ready' });
    }
  },
}));
