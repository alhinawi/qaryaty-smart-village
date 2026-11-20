import { useMemo, useState } from 'react';
import { GRILL_PRICE_PER_KILO } from '@/data/catalog';
import { useAddToCart } from '@/hooks/useAddToCart';
import { cartItemFromProduct, useCartStore } from '@/stores/useCartStore';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { useAuthStore } from '@/stores/useAuthStore';
import { stockKey, useDemoStock } from '@/components/merchant/demoStock';
import { NotifyStock } from '@/components/stock/NotifyStock';
import { QuantityPicker, QuantitySheet } from '@/components/ui/QuantityPicker';
import { formatQuantityNumber, quickQuantities } from '@/utils/quantity';
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
  // The quick choices: opened by tapping the number, or right after adding something
  // bought in bulk (bread: 5, 10, 20…), so 10 loaves is one more tap, not nine.
  const [choicesOpen, setChoicesOpen] = useState(false);

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
  const max = trackingDemo && count != null ? count : undefined;
  const bulk = (quickQuantities(item.unit, step)[0] ?? 1) >= 5;
  const add = async () => {
    if (bulk) setChoicesOpen(true);
    if (!(await addToCart(item))) setChoicesOpen(false);
  };
  if (!inCart) {
    if (round) {
      return (
        <button
          type="button"
          aria-label={`${label} ${item.name}`}
          disabled={trackingDemo && count != null && count < step}
          onClick={() => void add()}
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
        onClick={() => void add()}
        aria-label={`${label} ${item.name}`}
      >
        {label}
      </button>
    );
  }

  const sheet = (
    <QuantitySheet
      isOpen={choicesOpen}
      onClose={() => setChoicesOpen(false)}
      emoji={product.emoji}
      name={item.name}
      quantity={inCart.quantity}
      unit={item.unit}
      step={step}
      max={max}
      onChange={(q) => updateQuantity(item.id, q)}
    />
  );

  if (round) {
    const atMax = max != null && inCart.quantity + step > max;
    return (
      <>
        <div className="flex items-center gap-1" dir="ltr">
          <button
            type="button"
            aria-label={`العدد ${formatQuantityNumber(inCart.quantity)}${item.unit ? ` ${item.unit}` : ''} — غيّر عدد ${item.name}`}
            aria-haspopup="dialog"
            onClick={() => setChoicesOpen(true)}
            className="min-w-[44px] h-11 px-2.5 rounded-full bg-white text-green-dark border border-green/25 shadow-md text-[14px] font-extrabold cursor-pointer flex items-center gap-1"
            dir="rtl"
          >
            <span aria-live="polite">{formatQuantityNumber(inCart.quantity)}</span>
            <span className="text-[9px]" aria-hidden="true">▼</span>
          </button>
          <button
            type="button"
            aria-label={`أكتر ${item.name}`}
            disabled={atMax}
            onClick={() => updateQuantity(item.id, inCart.quantity + step)}
            className="w-11 h-11 rounded-full bg-white text-green border border-green/25 shadow-md text-[22px] font-extrabold leading-none cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            +
          </button>
        </div>
        {sheet}
      </>
    );
  }
  return (
    <QuantityPicker
      name={item.name}
      quantity={inCart.quantity}
      unit={item.unit}
      step={step}
      max={max}
      defaultOpen={choicesOpen}
      onChange={(q) => updateQuantity(item.id, q)}
    />
  );
}
