import {useAuthStore} from '@/stores/useAuthStore';
import {useTrackingDemoMode} from '@/hooks/useTrackingDemoMode';
import {offersRepo,isSupabaseConfigured,type DailyOffer} from '@/repositories';
import {createLocalOffersRepo} from '@/repositories/offers/localOffersRepo';
import {applyProductOffer} from '@/repositories/offers/priceOffer';
import { imageForService } from '@/config/serviceImages';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
// ─── Full search screen (opened from the header's search bar), in the style of Talabat:
// back + field + cart, tabs from the app's sections, "عايز إيه النهارده؟" circles, recent
// searches, the village's shops (or people), the first-order code, and live grouped results.
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowRight, History, Search, ShoppingCart, X } from "lucide-react";

import { useUIStore } from "@/stores/useUIStore";
import { useCartStore } from "@/stores/useCartStore";
import { useCatalogStore } from "@/stores/useCatalogStore";
import { useOrderStore } from "@/stores/useOrderStore";
import { useUserStore } from "@/stores/useUserStore";
import { useBackButtonClose } from "@/hooks/useBackButtonClose";
import { useGoToTab } from "@/hooks/useTabNavigation";
import { useReach } from "@/hooks/useReach";
import { useNavigate } from "react-router";
import { CATEGORIES } from "@/data/categories";
import { DONATION_SEARCH_FIELDS } from "@/config/donations";
import { matchesSearch } from "@/utils/arabicSearch";
import { ROUTES } from "@/routes";
import { productsForShop } from "@/data/catalog";
import { ShopMenuModal } from "@/components/modals/ShopMenuModal";
import { Avatar } from "@/components/shared/Avatar";
import { formatCurrency } from "@/utils/helpers";
import {
  FIRST_ORDER_PROMO,
  hasRealOrders,
  providerToOrderModalData,
  serviceToOrderModalData,
} from "@/utils/pricing";
import { isLocalProvider, villagesInReach } from "@/utils/reach";
import { whenHistorySettled } from "@/utils/overlayHistory";
import {
  ALL_TAB,
  buildSearchIndex,
  buildSearchTabs,
  exploreTiles,
  groupResults,
  searchEntries,
  shopTab,
  type ExploreTile,
  type ResultGroup,
  type SearchEntry,
  type SearchTabId,
} from "@/utils/searchScreen";
import type { OrderModalData, Provider, Service, Shop } from "@/types";
import { VoiceSearchButton } from './VoiceSearchButton';
import { Highlight } from "./Highlight";

const CLOSE_MS = 160;
const GROUP_PREVIEW = 4;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SHOP_TABS = new Set<SearchTabId>([
  ALL_TAB,
  "restaurants",
  "grocery",
  "pharmacy",
  "shops",
]);

interface SearchScreenProps {
  onOpenOrderModal: (data: OrderModalData) => void;
}

/** Mounted once the search was first opened; the shop menu outlives the screen. */
export function SearchScreen({ onOpenOrderModal }: SearchScreenProps) {
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const [menuShop, setMenuShop] = useState<Shop | null>(null);
  return (
    <>
      {isOpen && (
        <SearchOverlay
          onOpenOrderModal={onOpenOrderModal}
          onOpenMenu={setMenuShop}
        />
      )}
      <ShopMenuModal shop={menuShop} onClose={() => setMenuShop(null)} />
    </>
  );
}

function SearchOverlay({
  onOpenOrderModal,
  onOpenMenu,
}: SearchScreenProps & { onOpenMenu: (shop: Shop) => void }) {
  const setIsSearchOpen = useUIStore((s) => s.setIsSearchOpen);
  const voiceRequested = useUIStore.getState().voiceSearchRequested;
  const homeQuery = useUIStore((s) => s.searchQuery);
  const setHomeQuery = useUIStore((s) => s.setSearchQuery);
  const history = useUIStore((s) => s.searchHistory);
  const addSearchHistory = useUIStore((s) => s.addSearchHistory);
  const removeSearchHistoryItem = useUIStore((s) => s.removeSearchHistoryItem);
  const clearSearchHistory = useUIStore((s) => s.clearSearchHistory);
  const setIsCartOpen = useUIStore((s) => s.setIsCartOpen);
  const showToast = useUIStore((s) => s.showToast);
  const cartCount = useCartStore((s) => s.getTotalCount());
  const goToTab = useGoToTab();

  const shops = useCatalogStore((s) => s.shops);
  const services = useCatalogStore((s) => s.services);
  const providers = useCatalogStore((s) => s.providers);
  const loadCatalog = useCatalogStore((s) => s.load);
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const [query, setQuery] = useState(homeQuery);
  const deferredQuery = useDeferredValue(query);
  const [chosenTab, setTab] = useState<SearchTabId>(ALL_TAB);
  const [closing, setClosing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef(true);

  const scope=useAuthStore(s=>s.session?.user.id??'guest');
  const demo=useTrackingDemoMode();
  const [priceOffers,setPriceOffers]=useState<DailyOffer[]>([]);
  useEffect(()=>{let alive=true;const refresh=async()=>{const live=await offersRepo.listActive();const local=demo?await createLocalOffersRepo(scope).listActive():[];const localShops=new Set(local.map(o=>o.shopId));if(alive)setPriceOffers([...local,...live.filter(o=>!localShops.has(o.shopId))]);};void refresh().catch(()=>{if(alive)setPriceOffers([])});const timer=setInterval(()=>void refresh().catch(()=>{}),30000);return()=>{alive=false;clearInterval(timer)};},[scope,demo]);
  const index = useMemo(
    () =>
      buildSearchIndex({ shops, services, providers, categories: CATEGORIES }).map(entry=>entry.type==="product"?{...entry,product:applyProductOffer(entry.product,entry.shop.id,priceOffers.filter(()=>entry.shop.demo||!isSupabaseConfigured?demo:true))}:entry),
    [shops, services, providers,priceOffers,demo],
  );
  const tabs = useMemo(() => buildSearchTabs(index, CATEGORIES), [index]);
  const tab = tabs.some((t) => t.id === chosenTab) ? chosenTab : ALL_TAB;
  const hasQuery = deferredQuery.trim().length > 0;
  const navigate = useNavigate();
  // تبرع، زكاة، بيت المال… opens باب الخير, which has its own page
  const showDonations =
    hasQuery && matchesSearch(deferredQuery, [...DONATION_SEARCH_FIELDS]);
  const results = useMemo(
    () => searchEntries(index, deferredQuery, tab),
    [index, deferredQuery, tab],
  );
  const groups = useMemo(() => groupResults(results), [results]);
  const countOnAll = useMemo(
    () =>
      tab === ALL_TAB || results.length > 0
        ? 0
        : searchEntries(index, deferredQuery, ALL_TAB).length,
    [index, deferredQuery, tab, results.length],
  );
  const tiles = useMemo(
    () => exploreTiles(tab, shops, index),
    [tab, shops, index],
  );

  // ─── Closing: a short fade, then whatever the tap asked for (a menu, an order, the cart)
  const closeTimer = useRef<number | null>(null);
  const close = useCallback(
    (then?: () => void) => {
      if (closeTimer.current !== null) return;
      if (then) restoreFocusRef.current = false;
      setClosing(true);
      closeTimer.current = window.setTimeout(() => {
        setIsSearchOpen(false);
        // After the screen has gone and its back-button entry is removed, or a navigation
        // or the next overlay's entry would be the one that back removes
        if (then) window.setTimeout(() => whenHistorySettled(then), 0);
      }, CLOSE_MS);
    },
    [setIsSearchOpen],
  );
  const closePlain = useCallback(() => close(), [close]);
  useBackButtonClose(true, closePlain);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // Lock the page behind, focus the field, Escape closes, focus goes back to the search bar
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePlain();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
      if (restoreFocusRef.current) previous?.focus?.({ preventScroll: true });
    };
  }, [closePlain]);

  // Tab stays inside the screen
  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // ─── Actions
  const remember = () => addSearchHistory(query);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    remember();
    inputRef.current?.blur(); // hide the keyboard to show the results
  };

  const openShop = (shop: Shop) => {
    if (!shop.open) {
      showToast(`⚠️ ${shop.name} مغلق حالياً، بيفتح ${shop.time}`);
      return;
    }
    remember();
    if (shop.kind === "restaurant" || productsForShop(shop)) {
      close(() => onOpenMenu(shop));
      return;
    }
    close(() =>
      onOpenOrderModal({
        name: `طلب من ${shop.name}`,
        desc: `اكتب اللي محتاجه من ${shop.name} والمندوب هيجيبهولك`,
        price: "حسب الطلب",
        emoji: shop.emoji,
      }),
    );
  };

  const openService = (service: Service) => {
    remember();
    close(() => onOpenOrderModal(serviceToOrderModalData(service)));
  };

  const openPerson = (provider: Provider, service: Service) => {
    remember();
    close(() => onOpenOrderModal(providerToOrderModalData(provider, service)));
  };

  const openEntry = (entry: SearchEntry) => {
    if (entry.type === "shop" || entry.type === "product") openShop(entry.shop);
    else if (entry.type === "service") openService(entry.service);
    else openPerson(entry.provider, entry.service);
  };

  const showOnHome = () => {
    remember();
    setHomeQuery(query.trim());
    close(() => goToTab("home"));
  };

  const pickTerm = (term: string) => {
    setQuery(term);
    panelRef.current?.querySelector("[data-search-body]")?.scrollTo({ top: 0 });
  };

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={`fixed inset-0 z-[190] lg:flex lg:items-start lg:justify-center lg:p-6 lg:bg-black/45 ${
        closing
          ? "animate-[searchOut_0.16s_ease-in_forwards]"
          : "animate-[searchIn_0.2s_ease-out]"
      } motion-reduce:animate-none`}
      onMouseDown={(e) => {
        // Desktop: a click on the dark area around the panel closes it
        if (e.target === e.currentTarget) closePlain();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="البحث"
        onKeyDown={trapTab}
        className="h-full w-full flex flex-col bg-cream lg:h-auto lg:max-h-[calc(100svh-3rem)] lg:max-w-3xl lg:rounded-2xl lg:overflow-hidden lg:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
      >
        {/* ─── Top: back, field, cart, then the tabs */}
        <div className="bg-linear-to-br from-green-dark to-green pt-[max(0.625rem,env(safe-area-inset-top))] shadow-card shrink-0">
          <div className="flex items-center gap-2 px-3">
            <button
              type="button"
              onClick={closePlain}
              aria-label="رجوع"
              className="w-[44px] h-[44px] shrink-0 rounded-xl bg-white/15 border-none cursor-pointer flex items-center justify-center text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light"
            >
              <ArrowRight size={22} strokeWidth={2.5} aria-hidden="true" />
            </button>

            <form
              role="search"
              onSubmit={handleSubmit}
              className="flex-1 min-w-0"
            >
              <label className="flex items-center gap-2 bg-white rounded-xl ps-3 pe-1 h-[44px] shadow-sm focus-within:ring-2 focus-within:ring-gold-light">
                <Search
                  size={18}
                  strokeWidth={2.5}
                  className="text-green shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">
                  دوّر على محل أو أكلة أو خدمة أو مدرس
                </span>
                <input
                  ref={inputRef}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="عيش، سباك، شوي سمك، مدرس إنجليزي…"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-text font-['Cairo',sans-serif] text-[16px] placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
                />
                <VoiceSearchButton openInitially={voiceRequested} onText={(text) => { setQuery(text); setHomeQuery(text); }} />
                {query && (
                  <button
                    type="button"
                    onClick={clearQuery}
                    aria-label="مسح البحث"
                    className="w-[36px] h-[36px] shrink-0 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center text-text-muted hover:bg-black/5 hover:text-text"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                )}
              </label>
            </form>

            <button
              type="button"
              onClick={() => close(() => setIsCartOpen(true))}
              aria-label={cartCount > 0 ? `السلة، فيها ${cartCount}` : "السلة"}
              className="relative w-[44px] h-[44px] shrink-0 rounded-xl bg-white/15 border-none cursor-pointer flex items-center justify-center text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light"
            >
              <ShoppingCart size={21} strokeWidth={2.25} aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -start-1 min-w-[20px] h-[20px] px-1 rounded-full bg-gold text-black text-[11px] font-black flex items-center justify-center border-2 border-green">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div
            className="flex gap-1 overflow-x-auto px-3 mt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="الأقسام"
          >
            {tabs.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`relative shrink-0 px-3 pt-1.5 pb-2.5 min-h-[44px] bg-transparent border-none cursor-pointer font-['Cairo',sans-serif] text-[0.875rem] whitespace-nowrap transition-colors ${
                    active
                      ? "text-white font-black"
                      : "text-white/75 font-bold hover:text-white"
                  }`}
                >
                  {t.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-gold-light transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Body */}
        <div
          data-search-body
          className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <p className="sr-only" role="status" aria-live="polite">
            {hasQuery
              ? results.length > 0
                ? `${results.length} نتيجة`
                : "مفيش نتايج"
              : ""}
          </p>

          {showDonations && (
            <button
              type="button"
              onClick={() => close(() => void navigate(ROUTES.donate))}
              className="w-full flex items-center gap-3 mb-3 p-3 min-h-[56px] rounded-2xl bg-white border-2 border-gold-light text-start cursor-pointer font-['Cairo',sans-serif]"
            >
              <span
                className="w-[42px] h-[42px] bg-gold rounded-xl flex items-center justify-center text-[22px] shrink-0"
                aria-hidden="true"
              >
                🤲
              </span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-extrabold text-green-dark">
                  باب الخير
                </span>
                <span className="block text-xs text-text-muted">
                  بيت المال، الجمعية الشرعية، تجهيز عرايس وأبواب خير تانية
                </span>
              </span>
            </button>
          )}
          {hasQuery ? (
            results.length > 0 ? (
              <Results
                key={`${tab}|${deferredQuery}`}
                groups={groups}
                query={deferredQuery}
                onOpen={openEntry}
                onShowOnHome={showOnHome}
                stale={deferredQuery !== query}
              />
            ) : (
              <EmptyState
                query={deferredQuery}
                countOnAll={countOnAll}
                onShowAll={() => setTab(ALL_TAB)}
                tiles={tiles}
                onPick={pickTerm}
              />
            )
          ) : (
            <Explore
              tab={tab}
              tiles={tiles}
              history={history}
              onPick={pickTerm}
              onRemoveHistory={removeSearchHistoryItem}
              onClearHistory={clearSearchHistory}
              index={index}
              onOpenShop={openShop}
              onOpenPerson={openPerson}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Before typing: circles, recent searches, the village's shops or people, the code
function Explore({
  tab,
  tiles,
  history,
  onPick,
  onRemoveHistory,
  onClearHistory,
  index,
  onOpenShop,
  onOpenPerson,
}: {
  tab: SearchTabId;
  tiles: ExploreTile[];
  history: string[];
  onPick: (term: string) => void;
  onRemoveHistory: (term: string) => void;
  onClearHistory: () => void;
  index: SearchEntry[];
  onOpenShop: (shop: Shop) => void;
  onOpenPerson: (provider: Provider, service: Service) => void;
}) {
  const { reach } = useReach();
  const orders = useOrderStore((s) => s.orders);
  const usedPromoCodes = useUserStore((s) => s.usedPromoCodes);
  const showToast = useUIStore((s) => s.showToast);
  const promoAvailable =
    !usedPromoCodes.includes(FIRST_ORDER_PROMO) && !hasRealOrders(orders);

  const isShopTab = SHOP_TABS.has(tab);
  const places = useMemo(() => {
    if (!isShopTab) return [];
    const list = index.flatMap((e) => (e.type === "shop" ? [e.shop] : []));
    const inTab =
      tab === ALL_TAB
        ? list.filter((s) => s.kind !== "restaurant")
        : list.filter((s) => shopTab(s) === tab);
    return [...inTab].sort((a, b) => Number(b.open) - Number(a.open));
  }, [index, tab, isShopTab]);

  const people = useMemo(() => {
    if (isShopTab) return [];
    const list = index.flatMap((e) =>
      e.type === "person" && e.tabs.includes(tab) ? [e] : [],
    );
    return list
      .filter((e) => isLocalProvider(e.provider, reach))
      .sort((a, b) => b.provider.rating - a.provider.rating)
      .slice(0, 12);
  }, [index, tab, isShopTab, reach]);

  // "From your village" only when everyone in the row is; online people from farther away also show
  const nearby = villagesInReach(reach);
  const peopleTitle = people.every(
    (e) => e.type === "person" && nearby.has(e.provider.village),
  )
    ? `ناس من ${reach.village}${reach.includeNearby ? " واللي جنبها" : ""}`
    : "ناس تقدر تحجزهم";

  const placesTitle =
    tab === "restaurants"
      ? "مطاعم القرية"
      : tab === "grocery"
        ? "سوبر ماركت القرية"
        : tab === "pharmacy"
          ? "صيدليات القرية"
          : "محلات القرية";

  const copyCode = () => {
    navigator.clipboard?.writeText(FIRST_ORDER_PROMO).catch(() => {});
    showToast(`🎉 اتنسخ كود الخصم ${FIRST_ORDER_PROMO}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {tiles.length > 0 && (
        <section aria-labelledby="search-tiles-title">
          <h2
            id="search-tiles-title"
            className="text-[1.0625rem] font-black text-text mb-3"
          >
            {tab === "restaurants"
              ? "عايز تاكل إيه النهارده؟"
              : "عايز إيه النهارده؟"}
          </h2>
          <ul className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 list-none m-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
            {tiles.map((tile) => (
              <li key={tile.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onPick(tile.term)}
                  className="w-[76px] flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 group"
                >
                  <span className="w-[68px] h-[68px] rounded-full overflow-hidden bg-white border border-green/10 shadow-sm flex items-center justify-center text-[30px] transition-transform group-hover:scale-105 group-active:scale-95">
                    <TilePicture photo={tile.photo} emoji={tile.emoji} />
                  </span>
                  <span className="text-[0.75rem] font-bold text-text leading-tight text-center line-clamp-2">
                    {tile.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section aria-labelledby="search-history-title">
          <div className="flex items-center justify-between mb-2.5">
            <h2
              id="search-history-title"
              className="text-[1.0625rem] font-black text-text"
            >
              دوّرت عليه قبل كده
            </h2>
            <button
              type="button"
              onClick={onClearHistory}
              className="bg-transparent border-none cursor-pointer text-[0.8125rem] font-bold text-green px-2 min-h-[36px] hover:underline"
            >
              مسح الكل
            </button>
          </div>
          <ul className="flex flex-wrap gap-2 list-none m-0 p-0">
            {history.map((term) => (
              <li
                key={term}
                className="flex items-center bg-white border border-black/8 rounded-full shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => onPick(term)}
                  className="flex items-center gap-1.5 ps-3 pe-1 min-h-[38px] bg-transparent border-none cursor-pointer font-['Cairo',sans-serif] text-[0.875rem] text-text hover:text-green"
                >
                  <History
                    size={15}
                    className="text-text-muted"
                    aria-hidden="true"
                  />
                  {term}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveHistory(term)}
                  aria-label={`امسح ${term} من اللي دوّرت عليه`}
                  className="w-[34px] min-h-[38px] bg-transparent border-none cursor-pointer flex items-center justify-center text-text-muted hover:text-danger"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {places.length > 0 && (
        <section aria-labelledby="search-places-title">
          <h2
            id="search-places-title"
            className="text-[1.0625rem] font-black text-text mb-3"
          >
            {placesTitle}
          </h2>
          <ul className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 list-none m-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {places.map((shop) => (
              <li key={shop.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenShop(shop)}
                  className="w-[112px] flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-0 text-start group"
                >
                  <span
                    className="relative w-[112px] h-[84px] rounded-2xl overflow-hidden border border-green/10 shadow-sm flex items-center justify-center text-[38px] transition-transform group-hover:-translate-y-0.5"
                    style={{ background: shop.bgColor || "#f0fdf4" }}
                  >
                    <TilePicture photo={shop.photo} emoji={shop.emoji} />
                    {!shop.open && (
                      <span
                        className="absolute inset-0 bg-white/55"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="text-[0.8125rem] font-bold text-text leading-tight line-clamp-1">
                    {shop.name}
                  </span>
                  <span className="text-[0.6875rem] text-text-muted leading-tight">
                    <span
                      className={
                        shop.open
                          ? "text-success font-bold"
                          : "text-danger font-bold"
                      }
                    >
                      {shop.open ? "مفتوح" : "مغلق"}
                    </span>
                    {shop.time ? ` · ${shop.time}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {people.length > 0 && (
        <section aria-labelledby="search-people-title">
          <h2
            id="search-people-title"
            className="text-[1.0625rem] font-black text-text mb-3"
          >
            {peopleTitle}
          </h2>
          <ul className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 list-none m-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {people.map((e) =>
              e.type === "person" ? (
                <li key={e.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenPerson(e.provider, e.service)}
                    className="w-[96px] flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-0 text-center"
                  >
                    <Avatar
                      name={e.provider.name}
                      src={e.provider.photo}
                      size={64}
                    />
                    <span className="text-[0.75rem] font-bold text-text leading-tight line-clamp-2">
                      {e.provider.name}
                    </span>
                    <span className="text-[0.6875rem] text-text-muted leading-tight line-clamp-1">
                      {e.subtitle}
                    </span>
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {promoAvailable && (
        <section aria-labelledby="search-promo-title">
          <h2
            id="search-promo-title"
            className="text-[1.0625rem] font-black text-text mb-3"
          >
            متفوّتهاش
          </h2>
          <div className="rounded-2xl p-4 bg-[linear-gradient(135deg,#0f4f2e,#1a7a4a)] text-white flex items-center justify-between gap-3 shadow-card">
            <div className="min-w-0">
              <p className="font-black text-[1rem] mb-0.5">
                🎉 أول طلب من غير رسوم
              </p>
              <p className="text-[0.8125rem] text-white/85">
                اكتبه في خانة كود الخصم وإنت بتطلب، ومش هتدفع عمولة التطبيق على أول طلب.
              </p>
            </div>
            <button
              type="button"
              onClick={copyCode}
              aria-label={`انسخ كود الخصم ${FIRST_ORDER_PROMO}`}
              className="shrink-0 bg-gold text-black font-black text-[15px] px-4 min-h-[44px] rounded-xl border-none cursor-pointer font-['Cairo',sans-serif] hover:bg-gold-light"
            >
              {FIRST_ORDER_PROMO}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/** Search thumbnails share the neutral missing/broken-photo fallback. */
function TilePicture({ photo, emoji }: { photo?: string; emoji: string }) {
  return <ProductPhoto photo={photo} emoji={emoji} className="w-full h-full" />;
}

// ─── While typing: results grouped by type
function Results({
  groups,
  query,
  onOpen,
  onShowOnHome,
  stale,
}: {
  groups: ResultGroup[];
  query: string;
  onOpen: (entry: SearchEntry) => void;
  onShowOnHome: () => void;
  stale: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  return (
    <div
      className={`flex flex-col gap-5 transition-opacity ${stale ? "opacity-70" : ""}`}
    >
      {groups.map((group) => {
        const open = expanded.has(group.id) || groups.length === 1;
        const shown = open
          ? group.entries.slice(0, 60)
          : group.entries.slice(0, GROUP_PREVIEW);
        return (
          <section key={group.id} aria-labelledby={`search-group-${group.id}`}>
            <h2
              id={`search-group-${group.id}`}
              className="flex items-center gap-2 text-[0.9375rem] font-black text-text mb-1.5"
            >
              <span aria-hidden="true">{group.emoji}</span>
              {group.title}
              <span className="text-[0.75rem] font-bold text-text-muted">
                ({group.entries.length})
              </span>
            </h2>
            <ul className="list-none m-0 p-0 bg-white rounded-2xl border border-black/6 shadow-sm divide-y divide-black/5 overflow-hidden">
              {shown.map((entry) => (
                <li key={entry.key}>
                  <ResultRow entry={entry} query={query} onOpen={onOpen} />
                </li>
              ))}
            </ul>
            {!open && group.entries.length > GROUP_PREVIEW && (
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => new Set(prev).add(group.id))
                }
                className="mt-1.5 bg-transparent border-none cursor-pointer text-[0.8125rem] font-bold text-green min-h-[36px] px-1 hover:underline"
              >
                عرض الكل ({group.entries.length})
              </button>
            )}
          </section>
        );
      })}

      <button
        type="button"
        onClick={onShowOnHome}
        className="self-center bg-white border border-green/25 text-green font-bold text-[0.875rem] rounded-xl px-4 min-h-[44px] cursor-pointer font-['Cairo',sans-serif] hover:bg-green/5"
      >
        اعرض النتايج في الصفحة الرئيسية
      </button>
    </div>
  );
}

function ResultRow({
  entry,
  query,
  onOpen,
}: {
  entry: SearchEntry;
  query: string;
  onOpen: (entry: SearchEntry) => void;
}) {
  let thumb;
  let meta: string | null;
  let subtitle = entry.subtitle;
  let metaTone = "text-text";

  if (entry.type === "shop") {
    thumb = (
      <span
        className="w-[48px] h-[48px] rounded-xl overflow-hidden flex items-center justify-center text-[24px] shrink-0"
        style={{ background: entry.shop.bgColor || "#f0fdf4" }}
      >
        <TilePicture photo={entry.shop.photo} emoji={entry.shop.emoji} />
      </span>
    );
    meta = entry.shop.demo ? "" : entry.shop.open ? "مفتوح" : "مغلق";
    metaTone = entry.shop.open ? "text-success" : "text-danger";
  } else if (entry.type === "product") {
    thumb = (
      <span className="w-[48px] h-[48px] rounded-xl overflow-hidden bg-[#f9fafb] flex items-center justify-center text-[24px] shrink-0">
        <TilePicture photo={entry.product.photo} emoji={entry.product.emoji} />
      </span>
    );
    meta = `${formatCurrency(entry.product.price)}${entry.product.unit ? ` / ${entry.product.unit}` : ""}`;
    subtitle = `${entry.shop.name}${entry.product.originalPrice!=null?` · قبل الخصم ${formatCurrency(entry.product.originalPrice)}`:""}${entry.shop.open ? "" : " · مغلق دلوقتي"}`;
  } else if (entry.type === "service") {
    thumb = (
      <span
        className="w-[48px] h-[48px] rounded-xl bg-green/8 flex items-center justify-center text-[24px] shrink-0"
        aria-hidden="true"
      >
        <TilePicture photo={imageForService(entry.service)} emoji={entry.service.emoji} />
      </span>
    );
    meta = entry.service.price || null;
  } else {
    thumb = (
      <Avatar
        name={entry.provider.name}
        src={entry.provider.photo}
        size={48}
        className="shrink-0"
      />
    );
    subtitle = [entry.subtitle, entry.provider.village]
      .filter(Boolean)
      .join(" · ");
    meta = entry.provider.price || null;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[64px] bg-transparent border-none cursor-pointer text-start font-['Cairo',sans-serif] transition-colors hover:bg-green/5 active:bg-green/10"
    >
      {thumb}
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-[0.9375rem] text-text truncate">
          <Highlight text={entry.title} query={query} />
        </span>
        {subtitle && (
          <span className="block text-[0.75rem] text-text-muted truncate">
            <Highlight text={subtitle} query={query} />
          </span>
        )}
      </span>
      {meta && (
        <span
          className={`shrink-0 text-[0.75rem] font-bold max-w-[38%] truncate ${metaTone}`}
        >
          {meta}
        </span>
      )}
    </button>
  );
}

// ─── Nothing found
function EmptyState({
  query,
  countOnAll,
  onShowAll,
  tiles,
  onPick,
}: {
  query: string;
  countOnAll: number;
  onShowAll: () => void;
  tiles: ExploreTile[];
  onPick: (term: string) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center pt-8 gap-3">
      <span className="text-[52px]" aria-hidden="true">
        🔍
      </span>
      <h2 className="text-[1.0625rem] font-black text-text">
        مفيش نتايج لـ «{query.trim()}»
      </h2>
      <p className="text-[0.875rem] text-text-muted max-w-[300px]">
        جرّب كلمة تانية أقصر، أو اسم المحل أو الحاجة اللي محتاجها.
      </p>
      {countOnAll > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          className="bg-green text-white font-bold text-[0.875rem] rounded-xl px-4 min-h-[44px] border-none cursor-pointer font-['Cairo',sans-serif] hover:bg-green-dark"
        >
          فيه {countOnAll} نتيجة في «الكل»
        </button>
      )}
      {tiles.length > 0 && (
        <div className="mt-2 w-full">
          <p className="text-[0.8125rem] font-bold text-text-muted mb-2">
            أو جرّب:
          </p>
          <ul className="flex flex-wrap justify-center gap-2 list-none m-0 p-0">
            {tiles.slice(0, 8).map((tile) => (
              <li key={tile.key}>
                <button
                  type="button"
                  onClick={() => onPick(tile.term)}
                  className="bg-white border border-black/8 rounded-full px-3 min-h-[38px] cursor-pointer font-['Cairo',sans-serif] text-[0.8125rem] text-text shadow-sm hover:text-green"
                >
                  <span aria-hidden="true">{tile.emoji}</span> {tile.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchScreen;
