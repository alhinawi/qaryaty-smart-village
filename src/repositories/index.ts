import { validOrderPoint, ORDER_LOCATION_REQUIRED } from '@/utils/orderLocation';
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
import { getSupabase, isSupabaseConfigured, supabaseUrl } from './supabaseClient';
import { createMockCatalogRepo } from './catalog/mockCatalogRepo';
import { createSupabaseCatalogRepo } from './catalog/supabaseCatalogRepo';
import type { CatalogRepo } from './catalog/types';
import type { Shop } from '@/types';
import { createMockOrderRepo } from './orders/mockOrderRepo';
import { createSupabaseOrderRepo } from './orders/supabaseOrderRepo';
import type { NewOrder, OrderRepo } from './orders/types';
import { DELIVERY_FEE_DEFAULT } from '@/config/delivery';
import { RepoError, ServiceUnavailableError, UNAVAILABLE_MESSAGE } from './errors';
import { createSupabaseAuthRepo } from './auth/supabaseAuthRepo';
import { createMockDonationRepo } from './donations/mockDonationRepo';
import { createSupabaseDonationRepo } from './donations/supabaseDonationRepo';
import type { DonationRepo, NewDonationRequest } from './donations/types';
import { AuthError, mockAuthService, type AuthService } from '@/services/auth';
import { createLocalAddressRepo } from './addresses/localAddressRepo';
import { createSupabaseAddressRepo } from './addresses/supabaseAddressRepo';
import type { AddressRepo } from './addresses/types';
import { createMockVillageRepo } from './villages/mockVillageRepo';
import { createSupabaseVillageRepo } from './villages/supabaseVillageRepo';
import type { VillageOption, VillageRepo } from './villages/types';
import { createMockJobRepo } from './jobs/mockJobRepo';
import { createSupabaseJobRepo } from './jobs/supabaseJobRepo';
import type { JobRepo } from './jobs/types';
import { createMockRideRepo } from './rides/mockRideRepo';
import { createSupabaseRideRepo } from './rides/supabaseRideRepo';
import type { RideRepo } from './rides/types';
import { createLocalMarketRepo } from './market/localMarketRepo';
import { createSupabaseMarketRepo } from './market/supabaseMarketRepo';
import type { MarketRepo } from './market/types';
import { createLocalReferralRepo } from './referral/localReferralRepo';
import { createSupabaseReferralRepo } from './referral/supabaseReferralRepo';
import type { ClaimResult, ReferralInfo, ReferralRepo } from './referral/types';
import { createLocalNotificationsRepo } from './notifications/localNotificationsRepo';
import { createSupabaseNotificationsRepo } from './notifications/supabaseNotificationsRepo';
import type { NotificationsRepo } from './notifications/types';
import { invalidateDemoMode, isDemoMode, setDemoModeFlag } from '@/config/demoMode';
import { createLocalTopShopsRepo } from './topshops/localTopShopsRepo';
import { createSupabaseTopShopsRepo } from './topshops/supabaseTopShopsRepo';
import type { TopShopsRepo } from './topshops/types';
import { setAppearanceGate } from '@/config/appearanceGate';
import { createLocalSettingsRepo } from './settings/localSettingsRepo';
import { createSupabaseSettingsRepo } from './settings/supabaseSettingsRepo';
import type { SettingsRepo } from './settings/types';
import { createLocalOffersRepo } from './offers/localOffersRepo';
import { createSupabaseOffersRepo } from './offers/supabaseOffersRepo';
import type { OffersRepo } from './offers/types';

import { createMockAdminRepo } from './admin/mockAdminRepo';
import { createSupabaseAdminRepo } from './admin/supabaseAdminRepo';
import type { AdminRepo } from './admin/types';

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
const mockCatalog = createMockCatalogRepo(isDemoMode);

function createResilientCatalogRepo(live: CatalogRepo, fallback: CatalogRepo): CatalogRepo {
  // In الوضع الحقيقي a failed read must NOT silently show the demo sample data:
  // the visitor sees "الخدمة متوقفة" instead of fake shops.
  const demoOrFail =
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    (...args: A): Promise<R> =>
      isDemoMode()
        ? fn(...args)
        : Promise.reject(new ServiceUnavailableError(UNAVAILABLE_MESSAGE));
  return {
    getServices: () => resilience.read(live.getServices, demoOrFail(fallback.getServices)),
    getShops: () => resilience.read(live.getShops, demoOrFail(fallback.getShops)),
    getProviders: () => resilience.read(live.getProviders, demoOrFail(fallback.getProviders)),
    getProducts: (shop) =>
      resilience.read(
        () => live.getProducts(shop),
        demoOrFail(() => fallback.getProducts(shop))
      ),
    // Writes never fall back silently: the admin sees the error instead of
    // thinking a record was added when it only landed on this device.
    addShop: (input) => live.addShop(input),
    addProvider: (input) => live.addProvider(input),
  };
}

export const catalogRepo: CatalogRepo = isSupabaseConfigured
  ? createResilientCatalogRepo(createSupabaseCatalogRepo(getSupabase, isDemoMode), mockCatalog)
  : mockCatalog;

export const getServices = () => catalogRepo.getServices();
export const getShops = () => catalogRepo.getShops();
export const getProviders = () => catalogRepo.getProviders();
export const getProducts = (shop: Pick<Shop, 'id' | 'kind'> & Partial<Pick<Shop, 'name'>>) => catalogRepo.getProducts(shop);
export const addShop = (input: Parameters<CatalogRepo['addShop']>[0]) => catalogRepo.addShop(input);
export const addProvider = (input: Parameters<CatalogRepo['addProvider']>[0]) => catalogRepo.addProvider(input);

// ─── Orders (writes never fall back to the sample data)
export const ORDER_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، وطلبك ماتبعتش. جرّب تاني بعد شوية';

function createResilientOrderRepo(live: OrderRepo): OrderRepo {
  return {
    listMine: (ownerId, offset) => resilience.write(
      () => live.listMine(ownerId, offset),
      (cause) => new ServiceUnavailableError('مش قادرين نحمّل سجل الطلبات دلوقتي. جرّب تاني.', { cause })
    ),
    createOrder: (input) =>
      resilience.write(
        () => live.createOrder(input),
        (cause) => new ServiceUnavailableError(ORDER_UNAVAILABLE_MESSAGE, { cause })
      ),
    // Shows the default when the server can't answer; the order trigger charges its own anyway
    quoteDeliveryFee: (shopId) =>
      resilience.read(
        () => live.quoteDeliveryFee(shopId),
        async () => DELIVERY_FEE_DEFAULT
      ),
  };
}

export const orderRepo: OrderRepo = isSupabaseConfigured
  ? createResilientOrderRepo(createSupabaseOrderRepo(getSupabase))
  : createMockOrderRepo();

export const createOrder = (input: NewOrder) => {
  if (!validOrderPoint(input)) return Promise.reject(new Error(ORDER_LOCATION_REQUIRED));
  return orderRepo.createOrder(input);
};
export const quoteDeliveryFee = (shopId: number) => orderRepo.quoteDeliveryFee(shopId);
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
    setAvatar: guard(live.setAvatar),
    // Only decides whether the button shows; never trips the breaker
    isGoogleEnabled: live.isGoogleEnabled,
    signInWithGoogle: guard(live.signInWithGoogle),
    restoreSession: guard(live.restoreSession),
    completeProfile: guard(live.completeProfile),
    listUsers: guard(live.listUsers),
    setBlocked: guard(live.setBlocked),
    setRole: guard(live.setRole),
  };
}

export const authRepo: AuthService = isSupabaseConfigured
  ? createResilientAuthRepo(createSupabaseAuthRepo(getSupabase))
  : mockAuthService;

export { AuthError, type AuthService };
export { needsProfileCompletion, type CompleteProfileInput } from '@/services/auth';

// ─── Donation requests from /donate (writes never fall back to the sample data)
export const DONATION_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، وطلبك ماتبعتش. ابعتلنا على واتساب أو جرّب تاني بعد شوية';

const donationLive = isSupabaseConfigured ? createSupabaseDonationRepo(getSupabase) : null;
export const donationRepo: DonationRepo = donationLive
  ? {
      submitDonationRequest: (input) =>
        resilience.write(
          () => donationLive.submitDonationRequest(input),
          (cause) => new ServiceUnavailableError(DONATION_UNAVAILABLE_MESSAGE, { cause })
        ),
    }
  : createMockDonationRepo();

export const submitDonationRequest = (input: NewDonationRequest) => donationRepo.submitDonationRequest(input);
export type { NewDonationRequest };

// ─── Saved addresses (عناويني): Supabase for a signed-in customer, this device otherwise

export const ADDRESS_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، والعنوان ماتحفظش. جرّب تاني بعد شوية';
const localAddresses = createLocalAddressRepo();
const liveAddresses = isSupabaseConfigured ? createSupabaseAddressRepo(getSupabase) : null;
const resilientAddresses: AddressRepo | null = liveAddresses
  ? (() => {
      const w = <T>(fn: () => Promise<T>) =>
        resilience.write(fn, (cause) => new ServiceUnavailableError(ADDRESS_UNAVAILABLE_MESSAGE, { cause }));
      return {
        list: () => w(() => liveAddresses.list()),
        add: (draft, makeDefault) => w(() => liveAddresses.add(draft, makeDefault)),
        update: (id, draft) => w(() => liveAddresses.update(id, draft)),
        remove: (id) => w(() => liveAddresses.remove(id)),
        setDefault: (id) => w(() => liveAddresses.setDefault(id)),
      };
    })()
  : null;

/** Where this person's addresses live: their account when signed in to Supabase, else this device. */
export function addressRepoFor(signedIn: boolean): AddressRepo {
  return signedIn && resilientAddresses ? resilientAddresses : localAddresses;
}
export type { AddressRepo };

// ─── وظائف (job posts). Reads never fall back to sample jobs: a fake job is worse than none.
export const JOB_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، ومااتحفظش حاجة. جرّب تاني بعد شوية';
const liveJobs = isSupabaseConfigured ? createSupabaseJobRepo(getSupabase) : null;
export const jobRepo: JobRepo = liveJobs
  ? (() => {
      const w = <T>(fn: () => Promise<T>) =>
        resilience.write(fn, (cause) => new ServiceUnavailableError(JOB_UNAVAILABLE_MESSAGE, { cause }));
      const r = <T>(fn: () => Promise<T>, empty: T) => resilience.read(fn, async () => empty);
      return {
        listPublic: () => r(() => liveJobs.listPublic(), []),
        get: (id) => r(() => liveJobs.get(id), null),
        listMine: (ownerId) => r(() => liveJobs.listMine(ownerId), []),
        create: (ownerId, draft) => w(() => liveJobs.create(ownerId, draft)),
        update: (id, draft) => w(() => liveJobs.update(id, draft)),
        close: (id) => w(() => liveJobs.close(id)),
        reopen: (id) => w(() => liveJobs.reopen(id)),
        renew: (id) => w(() => liveJobs.renew(id)),
        remove: (id) => w(() => liveJobs.remove(id)),
        report: (id, reason, note) => w(() => liveJobs.report(id, reason, note)),
        listForReview: () => w(() => liveJobs.listForReview()),
        review: (id, approve, reason) => w(() => liveJobs.review(id, approve, reason)),
      } satisfies JobRepo;
    })()
  : createMockJobRepo();
export type { JobRepo };

// ─── شير مواصلة (shared trips). Reads never fall back to sample trips: a fake trip is worse than none.
export const RIDE_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، ومااتحفظش حاجة. جرّب تاني بعد شوية';
const liveRides = isSupabaseConfigured ? createSupabaseRideRepo(getSupabase) : null;
export const rideRepo: RideRepo = liveRides
  ? (() => {
      const w = <T>(fn: () => Promise<T>) =>
        resilience.write(fn, (cause) => new ServiceUnavailableError(RIDE_UNAVAILABLE_MESSAGE, { cause }));
      const r = <T>(fn: () => Promise<T>, empty: T) => resilience.read(fn, async () => empty);
      return {
        listPublic: () => r(() => liveRides.listPublic(), []),
        get: (id) => r(() => liveRides.get(id), null),
        listMine: (ownerId) => r(() => liveRides.listMine(ownerId), []),
        create: (ownerId, draft) => w(() => liveRides.create(ownerId, draft)),
        update: (id, draft) => w(() => liveRides.update(id, draft)),
        setPaused: (id, paused) => w(() => liveRides.setPaused(id, paused)),
        renew: (id) => w(() => liveRides.renew(id)),
        remove: (id) => w(() => liveRides.remove(id)),
        report: (id, reason, note) => w(() => liveRides.report(id, reason, note)),
        requestJoin: (rideId, seats, phone, note) => w(() => liveRides.requestJoin(rideId, seats, phone, note)),
        myRequest: (rideId, userId) => r(() => liveRides.myRequest(rideId, userId), null),
        requestsOnMyRides: (ownerId) => r(() => liveRides.requestsOnMyRides(ownerId), []),
        myRequests: (userId) => r(() => liveRides.myRequests(userId), []),
        respond: (requestId, accept) => w(() => liveRides.respond(requestId, accept)),
        cancelRequest: (requestId) => w(() => liveRides.cancelRequest(requestId)),
        listHidden: () => w(() => liveRides.listHidden()),
        restore: (id) => w(() => liveRides.restore(id)),
      } satisfies RideRepo;
    })()
  : createMockRideRepo();
export type { RideRepo };

// ─── Status
// ─── Villages of Egypt (the "القرية" picker): Supabase, the Mansoura villages in demo mode
const mockVillages = createMockVillageRepo();
const villageLive = isSupabaseConfigured ? createSupabaseVillageRepo(getSupabase) : null;
export const villageRepo: VillageRepo = villageLive
  ? { search: (q, limit) => resilience.read(() => villageLive.search(q, limit), () => mockVillages.search(q, limit)) }
  : mockVillages;
export type { VillageOption, VillageRepo };
export { normalizeArabic, villageOptionLabel } from './villages/types';

// ─── بيع المستعمل وتبادل: Supabase, or this device in demo mode
export const MARKET_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، جرّب تاني بعد شوية';
let marketUser: { id: string; name: string } | null = null;
/** Demo mode only: who is signed in (the pages call it with the session user). */
export function setMarketUser(user: { id: string; name: string } | null): void {
  marketUser = user;
}
const marketLive = isSupabaseConfigured ? createSupabaseMarketRepo(getSupabase, supabaseUrl) : null;
export const marketRepo: MarketRepo = marketLive
  ? (() => {
      const w = <T>(fn: () => Promise<T>) =>
        resilience.write(fn, (cause) => new ServiceUnavailableError(MARKET_UNAVAILABLE_MESSAGE, { cause }));
      const m = marketLive;
      return {
        photoUrl: m.photoUrl,
        list: (kind, opts) => w(() => m.list(kind, opts)),
        get: (id) => w(() => m.get(id)),
        mine: () => w(() => m.mine()),
        create: (d) => w(() => m.create(d)),
        update: (id, d) => w(() => m.update(id, d)),
        setStatus: (id, s) => w(() => m.setStatus(id, s)),
        remove: (l) => w(() => m.remove(l)),
        renew: (id) => w(() => m.renew(id)),
        report: (id, r, n) => w(() => m.report(id, r, n)),
        // Uploads can take longer than the read/write timeout on a slow phone
        uploadPhoto: (u, f) => m.uploadPhoto(u, f),
        deletePhotos: (p) => m.deletePhotos(p),
        thread: (l, b) => w(() => m.thread(l, b)),
        send: (l, b, t) => w(() => m.send(l, b, t)),
        markRead: (l, b) => w(() => m.markRead(l, b)),
        conversations: () => w(() => m.conversations()),
      } satisfies MarketRepo;
    })()
  : createLocalMarketRepo(() => marketUser);
export type * from './market/types';

export { isSupabaseConfigured };
export { useBackendStatus, type BackendMode } from './status';
export { RepoError, ServiceUnavailableError, UNAVAILABLE_MESSAGE };

/** "جرّب تاني": close the breaker so the next call goes to Supabase again. */
export function retryBackend(): void {
  breaker.reset();
}

// ─── دعوة الأصحاب (referral link + points)
// Reads fall back to zeros; claiming is a write and fails clearly.
export const REFERRAL_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، وكود الدعوة مااتسجلش. جرّب تاني بعد شوية';
const liveReferrals = isSupabaseConfigured ? createSupabaseReferralRepo(getSupabase) : null;
export const referralRepo: ReferralRepo = liveReferrals
  ? {
      getInfo: (userId) =>
        resilience.read(
          () => liveReferrals.getInfo(userId),
          async () => ({ code: '', invitedCount: 0, pointsEarned: 0 })
        ),
      claim: (userId, code) =>
        resilience.write(
          () => liveReferrals.claim(userId, code),
          (cause) => new ServiceUnavailableError(REFERRAL_UNAVAILABLE_MESSAGE, { cause })
        ),
    }
  : createLocalReferralRepo();
export type { ClaimResult, ReferralInfo, ReferralRepo };

// ─── الإشعارات الحقيقية (server notifications)
// Reads fall back to an empty list; marking read is best-effort.
const liveNotifications = isSupabaseConfigured ? createSupabaseNotificationsRepo(getSupabase) : null;
export const notificationsRepo: NotificationsRepo = liveNotifications
  ? {
      listMine: (userId) =>
        resilience.read(
          () => liveNotifications.listMine(userId),
          async () => []
        ),
      markRead: (id) => liveNotifications.markRead(id),
      markAllRead: (userId) => liveNotifications.markAllRead(userId),
    }
  : createLocalNotificationsRepo();
export { SERVER_NOTIF_PREFIX, type NotificationsRepo } from './notifications/types';

// ─── إعدادات الموقع (demo mode switch lives here)
export const SETTINGS_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، والإعداد ماتحفظش. جرّب تاني بعد شوية';
const liveSettings = isSupabaseConfigured ? createSupabaseSettingsRepo(getSupabase) : null;
export const settingsRepo: SettingsRepo = liveSettings
  ? {
      getDemoMode: () => liveSettings.getDemoMode(),
      getAppearanceEnabled: () => liveSettings.getAppearanceEnabled(),
      setAppearanceEnabled: (on) => resilience.write(() => liveSettings.setAppearanceEnabled(on), (cause) => new ServiceUnavailableError(SETTINGS_UNAVAILABLE_MESSAGE, { cause })),
      setDemoMode: (on) =>
        resilience.write(
          () => liveSettings.setDemoMode(on),
          (cause) => new ServiceUnavailableError(SETTINGS_UNAVAILABLE_MESSAGE, { cause })
        ),
      getWhatsappEnabled: () => liveSettings.getWhatsappEnabled(),
      setWhatsappEnabled: (on) =>
        resilience.write(
          () => liveSettings.setWhatsappEnabled(on),
          (cause) => new ServiceUnavailableError(SETTINGS_UNAVAILABLE_MESSAGE, { cause })
        ),
    }
  : createLocalSettingsRepo();
export type { SettingsRepo };

// ─── الأكتر طلبًا في القرية هذا الأسبوع (weekly order ranking)
const liveTopShops = isSupabaseConfigured ? createSupabaseTopShopsRepo(getSupabase) : null;
export const topShopsRepo: TopShopsRepo = liveTopShops ?? createLocalTopShopsRepo();
export type { WeeklyTopShop } from './topshops/types';

/** Reads the demo-mode switch and applies it. A failed read invalidates the
 * verified flag (simulated content fails closed) and the error propagates. */
export async function loadAppearanceSetting(): Promise<boolean> {
  try { const on = await settingsRepo.getAppearanceEnabled(); setAppearanceGate(on); return on; }
  catch (error) { setAppearanceGate(null); throw error; }
}

export async function loadDemoModeSetting(): Promise<boolean> {
  try {
    const on = await settingsRepo.getDemoMode();
    setDemoModeFlag(on);
    return on;
  } catch (error) {
    invalidateDemoMode();
    throw error;
  }
}

// ─── Cross-device propagation without a DB change: re-read the switch when
// the tab regains focus and on a slow 60s beat. setDemoModeFlag only notifies
// subscribers on a real change, so a quiet poll costs one cheap read.
// (Instant propagation would need Supabase Realtime on app_settings — a DB
// publication change that waits on the owner's approval like any DB change.)
const DEMO_MODE_POLL_MS = 60_000;
let demoModeWatchStarted = false;

/** Starts the background demo-mode watch once. Safe to call again. */
export function watchDemoModeSetting(): void {
  if (demoModeWatchStarted || typeof window === 'undefined') return;
  demoModeWatchStarted = true;
  void loadAppearanceSetting().catch(() => {});
  const refresh = () => {
    // A failed read invalidates the verified flag inside loadDemoModeSetting
    loadDemoModeSetting().catch(() => {});
    loadAppearanceSetting().catch(() => {});
  };
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
  window.setInterval(refresh, DEMO_MODE_POLL_MS);
}

// ─── واتساب الطلبات: the merchant saves his number + opt-in on his own shop
// row (RLS: "shops: owner edits own"). In demo mode the device store is the record.
export async function saveShopWhatsapp(shopId: number, phone: string, optIn: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('shops')
    .update({ whatsapp_phone: phone || null, whatsapp_opt_in: optIn })
    .eq('id', shopId);
  if (error) throw new RepoError('rejected', 'ماقدرناش نحفظ الإعداد — محتاج صلاحية إدارة', { cause: error });
}

// ─── بيانات المحل: the merchant's own row (RLS: "shops: owner edits own"),
// staff keep the admin policies. Only the fields the dashboard actually
// changed go in the update, so one failed edit never clobbers the rest.
import type { ShopBasicsUpdate } from './catalog/supabaseCatalogRepo';
export type { ShopBasicsUpdate } from './catalog/supabaseCatalogRepo';
export async function saveShopBasics(shopId: number, update: ShopBasicsUpdate): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { updateShopBasics } = await import('./catalog/supabaseCatalogRepo');
  return updateShopBasics(getSupabase, shopId, update);
}
// ─── عروض اليوم (merchant time-limited offers)
export const OFFERS_UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، والعرض ماتحفظش. جرّب تاني بعد شوية';
const liveOffers = isSupabaseConfigured ? createSupabaseOffersRepo(getSupabase) : null;
export const offersRepo: OffersRepo = liveOffers
  ? {
      listActive: () => resilience.read(() => liveOffers.listActive(), async () => []),
      mineForShop: (shopId) =>
        resilience.read(
          () => liveOffers.mineForShop(shopId),
          async () => null
        ),
      create: (shopId, shopName, title, details, hours, discount) =>
        resilience.write(
          () => liveOffers.create(shopId, shopName, title, details, hours, discount),
          (cause) => new ServiceUnavailableError(OFFERS_UNAVAILABLE_MESSAGE, { cause })
        ),
      stop: (offerId) =>
        resilience.write(
          () => liveOffers.stop(offerId),
          (cause) => new ServiceUnavailableError(OFFERS_UNAVAILABLE_MESSAGE, { cause })
        ),
    }
  : createLocalOffersRepo();
export type { DailyOffer, OffersRepo } from './offers/types';

// Reviews never fall back to fictional records, even during a backend outage.
import { createReviewsRepo } from './reviews/supabaseReviewsRepo';
export const reviewsRepo = createReviewsRepo(getSupabase);

// Merchant daily announcements: no fabricated fallback, no external integration.
import { createPricesRepo } from './prices/supabasePricesRepo';
export const pricesRepo = createPricesRepo(getSupabase);
export type { DailyPrice, PriceDraft } from './prices/types';
// ─── Admin dashboard (لوحة التحكم): no offline fallback, every call is checked on the server
export const adminRepo: AdminRepo = isSupabaseConfigured
  ? createSupabaseAdminRepo(getSupabase, supabaseUrl)
  : createMockAdminRepo();
