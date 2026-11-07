import { useMemo } from 'react';
import { GRILL_PRICE_PER_KILO } from '@/data/catalog';
import { useAddToCart } from '@/hooks/useAddToCart';
import { cartItemFromProduct, useCartStore } from '@/stores/useCartStore';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { useAuthStore } from '@/stores/useAuthStore';
import { stockKey, useDemoStock } from '@/components/merchant/demoStock';
import { NotifyStock } from '@/components/stock/NotifyStock';
import type { Product, Shop } from '@/types';

/**
 * One line's add button or quantity stepper. The round variant is the compact
 * overlay control for product-photo cards; every guard is shared so the two
 * shapes never disagree.
 */
export function LineControl({ shop, product, grill, label, round = false }: { shop: Shop; product: Product; grill: boolean; label: string; round?: boolean }) {
  const trackingDemo = useTrackingDemoMode();
  const item = useMemo(
    () => cartItemFromProduct(shop, product, grill ? { pricePerKilo: GRILL_PRICE_PER_KILO } : undefined),
    [shop, product, grill]
  );
  const inCart = useCartStore((s) => s.items.find((i) => i.id === item.id));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const addToCart = useAddToCart();
  const scope = useAuthStore((s) => s.session?.user.id ?? 'guest');
  const count = useDemoStock((s) => s.counts[stockKey(scope, shop.id, product.id)]);

  if (trackingDemo && count === 0) {
    return round
      ? <span className="text-[11px] font-bold text-text-muted bg-white/95 rounded-full px-2.5 py-1.5 shadow-sm">خلص</span>
      : <span className="text-xs font-bold text-text-muted">خلص · غير متاح</span>;
  }
  if ((shop.demo && !trackingDemo) || product.viewOnly) return null;

  if (product.available === false) {
    if (round) return <span className="text-[11px] font-bold text-text-muted bg-white/95 rounded-full px-2.5 py-1.5 shadow-sm">خلصان</span>;
    return <div className="flex flex-col gap-1 items-end"><span className="text-xs font-bold text-text-muted">خلصان</span><button disabled className="bg-gray-100 text-gray-400 rounded-lg px-3 py-2 text-xs">غير متاح</button>{!grill && <NotifyStock shop={shop} product={product} />}</div>;
  }

  const step = item.step ?? 1;
  if (!inCart) {
    if (round) {
      return (
        <button
          type="button"
          aria-label={`${label} ${item.name}`}
          disabled={trackingDemo && count != null && count < step}
          onClick={() => void addToCart(item)}
          className="w-10 h-10 rounded-full bg-white text-green border border-green/25 shadow-md text-[22px] font-extrabold leading-none cursor-pointer flex items-center justify-center disabled:opacity-50"
        >
          +
        </button>
      );
    }
    return (
      <button
        type="button"
        className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-green text-white text-[13px] font-bold cursor-pointer whitespace-nowrap"
        disabled={trackingDemo && count != null && count < (item.step ?? 1)}
        onClick={() => void addToCart(item)}
        aria-label={`${label} ${item.name}`}
      >
        {label}
      </button>
    );
  }

  if (round) {
    return (
      <div className="flex items-center bg-white rounded-full border border-green/25 shadow-md px-1 py-0.5" dir="ltr">
        <button type="button" aria-label={`أقل ${item.name}`} onClick={() => updateQuantity(item.id, inCart.quantity - step)} className="w-8 h-8 rounded-full text-green font-extrabold cursor-pointer">-</button>
        <span className="min-w-[20px] text-center text-[13px] font-extrabold" dir="rtl" aria-live="polite">{inCart.quantity}</span>
        <button type="button" aria-label={`أكتر ${item.name}`} disabled={trackingDemo && count != null && inCart.quantity + step > count} onClick={() => updateQuantity(item.id, inCart.quantity + step)} className="w-8 h-8 rounded-full text-green font-extrabold cursor-pointer disabled:opacity-50">+</button>
      </div>
    );
  }
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
        disabled={trackingDemo && count != null && inCart.quantity + step > count}
        onClick={() => updateQuantity(item.id, inCart.quantity + step)}
        aria-label={`أكتر ${item.name}`}
      >
        +
      </button>
    </div>
  );
}
