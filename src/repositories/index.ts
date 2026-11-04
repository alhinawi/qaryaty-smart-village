// ─── Data access for the whole app (Repository / Service layer)
//
// Pages and stores call these functions only: getServices(), createOrder(),
// authRepo.login()… They never import Supabase or src/data directly.
//
// Each repository is an interface with two implementations (Adapter/Strategy):
//   mock*Repo      sample data in the browser (src/data, localStorage)
//   supabase*Repo  the real backend
// Which one runs is picked once, here:
//   - no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY  → mock (demo mode)
//   - configured                                      → Supabase, wrapped so that
//       reads fall back to the sample data and show "الخدمة متوقفة مؤقتًا"
//       writes (orders, login, register) fail with a clear message instead
//       a circuit breaker stops calling Supabase for 30s after 3 failures in a row
import { createCircuitBreaker } from './circuitBreaker';
import { createResilience } from './resilient';
import { backendStatus } from './status';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { createMockCatalogRepo } from './catalog/mockCatalogRepo';
import { createSupabaseCatalogRepo } from './catalog/supabaseCatalogRepo';
import type { CatalogRepo } from './catalog/types';

const breaker = createCircuitBreaker({ failureThreshold: 3, cooldownMs: 30_000 });
const resilience = createResilience({ breaker, status: backendStatus, timeoutMs: 8_000 });

if (isSupabaseConfigured) backendStatus.markLive();

// ─── Catalog
const mockCatalog = createMockCatalogRepo();

function createResilientCatalogRepo(live: CatalogRepo, fallback: CatalogRepo): CatalogRepo {
  return {
    getServices: () => resilience.read(live.getServices, fallback.getServices),
    getShops: () => resilience.read(live.getShops, fallback.getShops),
    getProviders: () => resilience.read(live.getProviders, fallback.getProviders),
  };
}

export const catalogRepo: CatalogRepo = isSupabaseConfigured
  ? createResilientCatalogRepo(createSupabaseCatalogRepo(getSupabase), mockCatalog)
  : mockCatalog;

export const getServices = () => catalogRepo.getServices();
export const getShops = () => catalogRepo.getShops();
export const getProviders = () => catalogRepo.getProviders();

// ─── Status
export { isSupabaseConfigured };
export { useBackendStatus, type BackendMode } from './status';
export { RepoError, ServiceUnavailableError, UNAVAILABLE_MESSAGE } from './errors';

/** "جرّب تاني": close the breaker so the next call goes to Supabase again. */
export function retryBackend(): void {
  breaker.reset();
}
