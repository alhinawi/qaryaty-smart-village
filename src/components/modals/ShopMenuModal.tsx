// ─── Imports
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { GRILL_PRICE_PER_KILO, sectionsOf } from '@/data/catalog';
import { useAddToCart } from '@/hooks/useAddToCart';
import { cartItemFromProduct, useCartStore } from '@/stores/useCartStore';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatCurrency } from '@/utils/helpers';
import { isShopBusy } from '@/utils/shopBusy';
import type { Product, Shop } from '@/types';

interface ShopMenuModalProps {
  shop: Shop | null;
  onClose: () => void;
}

const ALL = 'الكل';

/** Arabic search that ignores alef/yaa/taa-marbuta spelling differences. */
function normalize(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u0652]/g, '')
    .toLowerCase()
    .trim();
}

// ─── One line's add button or quantity stepper
function LineControl({ shop, product, grill, label }: { shop: Shop; product: Product; grill: boolean; label: string }) {
  const item = useMemo(
    () => cartItemFromProduct(shop, product, grill ? { pricePerKilo: GRILL_PRICE_PER_KILO } : undefined),
    [shop, product, grill]
  );
  const inCart = useCartStore((s) => s.items.find((i) => i.id === item.id));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const addToCart = useAddToCart();

  if (shop.demo || product.viewOnly) return null;

  if (!inCart) {
    return (
      <button
        type="button"
        className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-green text-white text-[13px] font-bold cursor-pointer whitespace-nowrap"
        onClick={() => void addToCart(item)}
        aria-label={`${label} ${item.name}`}
      >
        {label}
      </button>
    );
  }

  const step = item.step ?? 1;
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      <button
        type="button"
        className="w-9 h-9 rounded-lg bg-white border border-gray-300 font-extrabold cursor-pointer"
        onClick={() => updateQuantity(item.id, inCart.quantity - step)}
        aria-label={`أقل ${item.name}`}
      >
        -
      </button>
      <span className="min-w-[58px] text-center text-[13px] font-extrabold" dir="rtl" aria-live="polite">
        {inCart.quantity.toLocaleString('ar-EG')} {item.unit}
      </span>
      <button
        type="button"
        className="w-9 h-9 rounded-lg bg-white border border-gray-300 font-extrabold cursor-pointer"
        onClick={() => updateQuantity(item.id, inCart.quantity + step)}
        aria-label={`أكتر ${item.name}`}
      >
        +
      </button>
    </div>
  );
}

// ─── Component
/** A shop's or restaurant's list, in sections, with search; items go to the cart. */
export function ShopMenuModal({ shop, onClose }: ShopMenuModalProps) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState(ALL);
  // The menu comes through the repository (Supabase, or the sample data offline)
  const loaded = useCatalogStore((s) => (shop ? s.products[shop.id] : undefined));
  const loadProducts = useCatalogStore((s) => s.loadProducts);
  useEffect(() => {
    if (shop) void loadProducts(shop);
  }, [shop, loadProducts]);
  const isLoading = loaded === undefined || loaded === 'loading';
  // Products the merchant marked as sold out never show to customers
  const products = useMemo(() => (Array.isArray(loaded) ? loaded.filter((p) => p.available !== false) : []), [loaded]);
  const sections = useMemo(() => sectionsOf(products).filter(Boolean), [products]);
  const count = useCartStore((s) => (shop && s.getVendor()?.key === `shop:${shop.id}` ? s.items.length : 0));
  const total = useCartStore((s) => (count ? s.getTotalAmount() : 0));
  const setIsCartOpen = useUIStore((s) => s.setIsCartOpen);

  const visible = useMemo(() => {
    const q = normalize(query);
    return products.filter((p) => (section === ALL || p.section === section) && (!q || normalize(p.name).includes(q)));
  }, [products, query, section]);

  const close = () => {
    setQuery('');
    setSection(ALL);
    onClose();
  };

  if (!shop) return null;

  return (
    <Modal isOpen onClose={close} title={shop.name} emoji={shop.emoji} maxWidth="640px">
      <div dir="rtl" className="text-right">
        {!shop.demo && isShopBusy(shop) && (
          <p className="text-[12px] font-bold text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-2">
            🟠 المحل مشغول دلوقتي — طلبك هيتسجل عادي بس التحضير هياخد وقت أطول من المعتاد.
          </p>
        )}
        {shop.demo && (
          <p className="text-[12px] text-gray-600 bg-amber-50 rounded-lg px-3 py-2 mb-2">{shop.kind === 'pharmacy' ? 'بيانات خيالية للتجربة فقط، ليست صيدلية حقيقية ولا تعبر عن مخزون متاح. لا يمكن الطلب منها.' : 'محل خيالي. الصور والأصناف توضيحية، ولا تعبر عن محل فعلي أو مخزون متاح. لا يمكن الطلب منه.'}</p>
        )}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`دوّر في ${shop.name}…`}
          aria-label="بحث في المنتجات"
          className="w-full mb-3 px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-green"
        />

        {sections.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2" role="tablist" aria-label="الأقسام">
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
          <p className="text-[12px] text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-2">
            الأدوية اللي عليها «بروشتة» الصيدلي بيراجع الروشتة قبل التوصيل. الأسعار تقريبية. الصور توضيحية مولدة، مش صورة العبوة الفعلية؛ اعتمد على الاسم والتركيز ومراجعة الصيدلي، مش الصورة.
          </p>
        )}

        {isLoading && (
          <ul className="flex flex-col gap-2" aria-label="بنحمّل المنيو">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-[76px] rounded-xl bg-gray-100 animate-pulse" />
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
          <ul className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto overscroll-none touch-pan-y">
            {visible.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                <ProductPhoto photo={p.photo} emoji={p.emoji} className="w-14 h-14 rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">
                    {p.name}
                    {p.rx && (
                      <span className="ms-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 rounded px-1.5 py-0.5">
                        بروشتة
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-gray-600">
                    {formatCurrency(p.price)} / {p.unit}
                  </div>
                  {p.grillable && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[12px] text-orange-700">
                        شراء وشوي: {formatCurrency(p.price + GRILL_PRICE_PER_KILO)} / {p.unit}
                      </span>
                      <LineControl shop={shop} product={p} grill label="أضف مشوي" />
                    </div>
                  )}
                </div>
                <LineControl shop={shop} product={p} grill={false} label="أضف" />
              </li>
            ))}
            {visible.length === 0 && (
              <li className="text-center text-gray-500 py-6">
                {products.length === 0 ? 'المنيو لسه مش متاح، اكتب طلبك للمندوب.' : 'مفيش حاجة بالاسم ده'}
              </li>
            )}
          </ul>
        )}

        {count > 0 && (
          <button
            type="button"
            className="mt-3 w-full py-3 rounded-xl bg-green-dark text-white font-extrabold cursor-pointer"
            onClick={() => {
              close();
              setIsCartOpen(true);
            }}
          >
            السلة: {count.toLocaleString('ar-EG')} صنف • {formatCurrency(total)}
          </button>
        )}
      </div>
    </Modal>
  );
}
