import { contentVisible } from '@/utils/contentProvenance';
import { DemoOpinions } from '@/components/reviews/DemoOpinions';
import { useProviderDashboardStore } from '@/stores/useProviderDashboardStore';
import { OfferPrice } from '@/components/ui/OfferPrice';
import { isSupabaseConfigured } from '@/repositories/supabaseClient';
// ─── Imports
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { GRILL_PRICE_PER_KILO, sectionsOf } from '@/data/catalog';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatCurrency } from '@/utils/helpers';
import { isShopBusy } from '@/utils/shopBusy';
import { isShopOpenNow } from '@/utils/shopOpenNow';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import { createLocalOffersRepo } from '@/repositories/offers/localOffersRepo';
import { offersRepo, type DailyOffer } from '@/repositories';
import { applyProductOffer } from '@/repositories/offers/priceOffer';
import { LineControl } from '@/components/shop/LineControl';
import { NotifyStock } from '@/components/stock/NotifyStock';
import { normalizeArabic } from '@/utils/arabicSearch';
import { dialogTabStops, isTopDialog } from '@/utils/dialogFocus';
import type { Product, Shop } from '@/types';

interface ShopMenuPageProps {
  shop: Shop | null;
  onClose: () => void;
}

const ALL = 'الكل';

function GrillRow({ shop, product }: { shop: Shop; product: Product }) {
  if (!product.grillable) return null;
  return (
    <div className="mt-1 flex items-center justify-between gap-2">
      <span className="text-[12px] text-orange-700">
        شراء وشوي: {formatCurrency(product.price + GRILL_PRICE_PER_KILO)} / {product.unit}
      </span>
      <LineControl shop={shop} product={product} grill label="أضف مشوي" />
    </div>
  );
}

/** The shop's full-screen page: cover, info card, sections and a product grid. */
export function ShopMenuPage({ shop, onClose }: ShopMenuPageProps) {
  const trackingDemo = useTrackingDemoMode();
  const offerScope = useAuthStore((s) => s.session?.user.id ?? 'guest');
  const [offers, setOffers] = useState<DailyOffer[]>([]);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState(ALL);
  const panelRef = useRef<HTMLDivElement>(null);
  // The menu comes through the repository (Supabase, or the sample data offline)
  const loaded = useCatalogStore((s) => (shop ? s.products[shop.id] : undefined));
  const loadProducts = useCatalogStore((s) => s.loadProducts);
  const localOverride = useProviderDashboardStore((s) => (shop ? s.merchants[shop.id] : undefined));
  const isLoading = loaded === undefined || loaded === 'loading';
  const products = useMemo(() => (Array.isArray(loaded) && shop ? loaded.filter((p) => contentVisible(p, trackingDemo)).map((p) => { const edit = trackingDemo ? localOverride?.products[p.id] : undefined; return applyProductOffer(edit ? { ...p, ...edit } : p, shop.id, offers); }) : []), [loaded, shop, offers, localOverride, trackingDemo]);
  const sections = useMemo(() => sectionsOf(products).filter(Boolean), [products]);
  const count = useCartStore((s) => (shop && s.getVendor()?.key === `shop:${shop.id}` ? s.items.length : 0));
  const total = useCartStore((s) => (count ? s.getTotalAmount() : 0));
  const setIsCartOpen = useUIStore((s) => s.setIsCartOpen);

  const open = !!shop;

  // Android/browser back closes the page instead of leaving the app
  useBackButtonClose(open, onClose);

  // Move focus into the page on open and give it back on close
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // Lock background scroll, Escape closes, Tab stays inside the page
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel || !isTopDialog(panel)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const stops = dialogTabStops(panel);
        const first = stops[0];
        const last = stops.at(-1);
        if (!first) { e.preventDefault(); panel.focus(); return; }
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panel || !panel.contains(active))) {
          e.preventDefault(); last?.focus();
        } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
          e.preventDefault(); first.focus();
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      const panel = panelRef.current;
      if (panel && isTopDialog(panel) && event.target instanceof Node && !panel.contains(event.target)) panel.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', containFocus);
    };
  }, [open, onClose]);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (shop) {
        void loadProducts(shop, true);
        const repo = (shop.demo || !isSupabaseConfigured) && trackingDemo ? createLocalOffersRepo(offerScope) : offersRepo;
        repo.mineForShop(shop.id).then((row) => { if (alive) setOffers(row ? [row] : []); }).catch(() => { if (alive) setOffers([]); });
      }
    };
    refresh();
    const timer = shop ? setInterval(refresh, 30000) : undefined;
    return () => { alive = false; clearInterval(timer); };
  }, [shop, loadProducts, trackingDemo, offerScope]);

  const visible = useMemo(() => {
    const q = normalizeArabic(query);
    return products.filter((p) => (section === ALL || p.section === section) && (!q || normalizeArabic(p.name).includes(q)));
  }, [products, query, section]);

  const close = () => {
    setQuery('');
    setSection(ALL);
    onClose();
  };

  if (!shop) return null;

  const offer = offers[0];

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`منيو ${shop.name}`}
      className="fixed inset-0 z-200 bg-cream overflow-y-auto overscroll-contain outline-none text-right animate-[fadeIn_0.2s_ease]"
      dir="rtl"
    >
      <button
        type="button"
        onClick={close}
        aria-label="رجوع"
        className="fixed top-3 right-3 z-30 w-10 h-10 rounded-full bg-white shadow-md text-[18px] font-extrabold text-text cursor-pointer flex items-center justify-center"
      >
        →
      </button>

      <div className="relative h-44 bg-green-dark">
        {shop.photo && <img src={shop.photo} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="px-3 pb-2 -mt-12 relative max-w-2xl mx-auto">
        <section aria-label="بيانات المحل" className="bg-white rounded-2xl shadow-md p-3.5 mb-3">
          <h1 className="text-[19px] font-black text-text">{shop.name}</h1>
          <p className="text-[13px] text-text-muted mt-0.5">{shop.description}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[12px] text-text-muted">
            {!shop.demo && (
              <span className={`font-bold ${isShopOpenNow(shop) ? 'text-success' : 'text-danger'}`}>
                {isShopOpenNow(shop) ? 'مفتوح' : `مغلق · بيفتح ${shop.time}`}
              </span>
            )}
            {shop.rating != null && <span>⭐ {shop.rating}</span>}
            {shop.deliveryTime && <span>🛵 {shop.deliveryTime}</span>}
            {shop.village && <span>📍 {shop.village}</span>}
          </div>
          {offer && (
            <p className="mt-2 text-[12px] font-bold text-green bg-green/8 rounded-lg px-3 py-2">
              🏷️ {offer.title}
            </p>
          )}
        </section>

        {!shop.demo && isShopBusy(shop) && (
          <p className="text-[12px] font-bold text-[#92400e] bg-[#fffbeb] border border-[#e7cd7a] rounded-lg px-3 py-2 mb-2">
            🕐 المحل مشغول — التحضير هياخد وقت أطول من المعتاد
          </p>
        )}

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`دوّر في ${shop.name}…`}
          aria-label="بحث في المنتجات"
          className="w-full mb-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-green bg-white"
        />

        {sections.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="الأقسام">
            {[ALL, ...sections].map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={section === s}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-bold cursor-pointer border ${
                  section === s ? 'bg-green text-white border-green' : 'bg-white text-gray-700 border-gray-200'
                }`}
                onClick={() => setSection(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {shop.kind === 'pharmacy' && (
          <p className="text-[12px] text-gray-600 bg-blue-50 rounded-lg px-3 py-2 my-2">
            الأدوية اللي عليها «بروشتة» الصيدلي بيراجع الروشتة قبل التوصيل. الأسعار تقريبية. اعتمد على الاسم والتركيز ومراجعة الصيدلي، مش الصورة.
          </p>
        )}

        {isLoading && (
          <ul className="grid grid-cols-2 gap-2.5 mt-2.5 list-none p-0" aria-label="بنحمّل المنيو">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-[220px] rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </ul>
        )}

        {loaded === 'error' && (
          <div className="text-center py-6" role="alert">
            <p className="text-gray-600 mb-3">المنيو ماحمّلش، اتأكد من النت وجرّب تاني.</p>
            <button
              type="button"
              className="min-h-[44px] px-5 rounded-xl bg-green text-white font-bold cursor-pointer"
              onClick={() => void loadProducts(shop, true)}
            >
              جرّب تاني
            </button>
          </div>
        )}

        {!isLoading && loaded !== 'error' && (
          <ul className="grid grid-cols-2 gap-2.5 mt-2.5 list-none p-0">
            {visible.map((p) => (
              <li key={p.id} className="bg-white rounded-2xl border border-black/6 shadow-sm p-2 flex flex-col gap-1.5">
                <div className="relative">
                  <ProductPhoto photo={p.photo} emoji={p.emoji} className="w-full aspect-square rounded-xl" />
                  <div className="absolute bottom-1.5 left-1.5">
                    <LineControl shop={shop} product={p} grill={false} label="أضف" round />
                  </div>
                </div>
                <div className="text-[13px] font-bold leading-snug line-clamp-2 min-h-[2.5em]">
                  {p.name}
                  {p.rx && (
                    <span className="ms-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 rounded px-1.5 py-0.5">
                      بروشتة
                    </span>
                  )}
                  {p.available === false && <span className="ms-1 text-[11px] rounded bg-gray-100 text-text-muted px-1.5 py-0.5">خلصان</span>}
                </div>
                <div className="text-[12px]">
                  <OfferPrice price={p.price} original={p.originalPrice} percent={p.offerPercent} unit={p.unit} />
                  {p.offerId && <span className="block text-[11px] text-green">سعر العرض لحد {new Date(p.offerEndsAt!).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</span>}
                </div>
                {p.available === false && <NotifyStock shop={shop} product={p} />}
                <DemoOpinions kind="product" target={`${shop.id}:${p.id}`} compact />
                <GrillRow shop={shop} product={p} />
              </li>
            ))}
            {visible.length === 0 && (
              <li className="col-span-2 text-center text-gray-500 py-8">
                {products.length === 0 ? 'المنيو لسه مش متاح، اكتب طلبك للمندوب.' : 'مفيش حاجة بالاسم ده'}
              </li>
            )}
          </ul>
        )}

        {count > 0 && (
          <div className="sticky bottom-0 inset-x-0 pt-3 pb-3 bg-gradient-to-t from-cream via-cream to-transparent">
            <button
              type="button"
              className="w-full py-3 rounded-2xl bg-green-dark text-white font-extrabold cursor-pointer shadow-lg"
              onClick={() => {
                close();
                setIsCartOpen(true);
              }}
            >
              السلة: {count.toLocaleString('ar-EG')} صنف • {formatCurrency(total)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
