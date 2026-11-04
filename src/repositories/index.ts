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
import type { Shop } from '@/types';
import { createMockOrderRepo } from './orders/mockOrderRepo';
import { createSupabaseOrderRepo } from './orders/supabaseOrderRepo';
import type { NewOrder, OrderRepo } from './orders/types';
import { RepoError, ServiceUnavailableError, UNAVAILABLE_MESSAGE } from './errors';
import { createSupabaseAuthRepo } from './auth/supabaseAuthRepo';
import { AuthError, mockAuthService, type AuthService } from '@/services/auth';

const breaker = createCircuitBreaker({ failureThreshold: 3, cooldownMs: 30_000 });
const resilience = createResilience({
  breaker,
  status: backendStatus,
  timeoutMs: 8_000,
  // A refused request means the backend is up
  isExpectedError: (error) =>
    (error instanceof RepoError && error.code === 'rejected') ||
    (error instanceof AuthError && error.code !== 'unavailable'),
});

if (isSupabaseConfigured) backendStatus.markLive();

// ─── Catalog
const mockCatalog = createMockCatalogRepo();

function createResilientCatalogRepo(live: CatalogRepo, fallback: CatalogRepo): CatalogRepo {
  return {
    getServices: () => resilience.read(live.getServices, fallback.getServices),
    getShops: () => resilience.read(live.getShops, fallback.getShops),
    getProviders: () => resilience.read(live.getProviders, fallback.getProviders),
    getProducts: (shop) =>
      resilience.read(
        () => live.getProducts(shop),
        () => fallback.getProducts(shop)
      ),
  };
}

export const catalogRepo: CatalogRepo = isSupabaseConfigured
  ? createResilientCatalogRepo(createSupabaseCatalogRepo(getSupabase), mockCatalog)
  : mockCatalog;

export const getServices = () => catalogRepo.getServices();
export const getShops = () => catalogRepo.getShops();
export const getProviders = () => catalogRepo.getProviders();
export const getProducts = (shop: Pick<Shop, 'id' | 'kind'>) => catalogRepo.getProducts(shop);

// ─── Orders (writes never fall back to the sample data)
export const ORDER_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، وطلبك ماتبعتش. جرّب تاني بعد شوية';

function createResilientOrderRepo(live: OrderRepo): OrderRepo {
  return {
    createOrder: (input) =>
      resilience.write(
        () => live.createOrder(input),
        (cause) => new ServiceUnavailableError(ORDER_UNAVAILABLE_MESSAGE, { cause })
      ),
  };
}

export const orderRepo: OrderRepo = isSupabaseConfigured
  ? createResilientOrderRepo(createSupabaseOrderRepo(getSupabase))
  : createMockOrderRepo();

export const createOrder = (input: NewOrder) => orderRepo.createOrder(input);
export type { NewOrder };

// ─── Auth (login/register never fall back to the demo accounts)
export const AUTH_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، ومش هنقدر ندخّلك دلوقتي. جرّب تاني بعد شوية';

function createResilientAuthRepo(live: AuthService): AuthService {
  const guard =
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    (...args: A) =>
      resilience.write(
        () => fn(...args),
        () => new AuthError('unavailable', AUTH_UNAVAILABLE_MESSAGE)
      );
  return {
    register: guard(live.register),
    login: guard(live.login),
    isUsernameAvailable: guard(live.isUsernameAvailable),
    logout: guard(live.logout),
    getUser: guard(live.getUser),
    updateProfile: guard(live.updateProfile),
    listUsers: guard(live.listUsers),
    setBlocked: guard(live.setBlocked),
    setRole: guard(live.setRole),
  };
}

export const authRepo: AuthService = isSupabaseConfigured
  ? createResilientAuthRepo(createSupabaseAuthRepo(getSupabase))
  : mockAuthService;

export { AuthError, type AuthService };

// ─── Status
export { isSupabaseConfigured };
export { useBackendStatus, type BackendMode } from './status';
export { RepoError, ServiceUnavailableError, UNAVAILABLE_MESSAGE };

/** "جرّب تاني": close the breaker so the next call goes to Supabase again. */
export function retryBackend(): void {
  breaker.reset();
}
