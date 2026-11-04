// ─── Imports
import type { CartItem, Order, OrderModalData, PriceType, Service } from '@/types';

// ─── Promo code
// NOTE: this check runs on the device only, so it is a UX guard, not real
// protection. Once there is a backend it must validate the code once per phone.
export const FIRST_ORDER_PROMO = 'QARYA1';

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Demo orders shipped with the app don't count as the user's own orders. */
export function hasRealOrders(orders: Order[]): boolean {
  return orders.some((order) => !order.id.startsWith('ord_demo_'));
}

export type PromoCheck =
  | { ok: true; code: string }
  | { ok: false; message: string };

export function checkPromoCode(
  rawCode: string,
  context: {
    orders: Order[];
    usedPromoCodes: string[];
    /** Amount the code would apply to. 0 or null means nothing to discount. */
    discountableAmount: number | null;
  }
): PromoCheck {
  const code = normalizePromoCode(rawCode);

  if (!code) {
    return { ok: false, message: '✍️ اكتب كود الخصم الأول' };
  }
  if (code !== FIRST_ORDER_PROMO) {
    return { ok: false, message: '❌ كود الخصم غير صحيح' };
  }
  if (context.usedPromoCodes.includes(code) || hasRealOrders(context.orders)) {
    return {
      ok: false,
      message: `ℹ️ كود ${FIRST_ORDER_PROMO} لأول طلب بس، واتستخدم قبل كده`,
    };
  }
  if (!context.discountableAmount) {
    return {
      ok: false,
      message: `ℹ️ كود ${FIRST_ORDER_PROMO} بيتطبق على الخدمات اللي ليها سعر ثابت بس`,
    };
  }
  return { ok: true, code };
}

// ─── Single service pricing (OrderModal)
export interface OrderPricing {
  priceType: PriceType;
  /** Price shown as the service price; null when it is set after confirmation. */
  basePrice: number | null;
  /** Only fixed prices can be discounted. */
  discountableAmount: number;
  discountAmount: number;
  /** null when the price is set after confirmation. */
  finalPrice: number | null;
  isEstimate: boolean;
}

export function resolvePriceType(data: {
  numericPrice?: number | null;
  priceType?: PriceType;
}): PriceType {
  if (data.numericPrice == null || data.numericPrice <= 0) return 'quote';
  return data.priceType ?? 'fixed';
}

export function getOrderPricing(
  data: Pick<OrderModalData, 'numericPrice' | 'priceType'>,
  discountApplied: boolean
): OrderPricing {
  const priceType = resolvePriceType(data);

  if (priceType === 'quote') {
    return {
      priceType,
      basePrice: null,
      discountableAmount: 0,
      discountAmount: 0,
      finalPrice: null,
      isEstimate: false,
    };
  }

  const basePrice = data.numericPrice as number;
  const discountableAmount = priceType === 'fixed' ? basePrice : 0;
  const discountAmount = discountApplied ? discountableAmount : 0;

  return {
    priceType,
    basePrice,
    discountableAmount,
    discountAmount,
    finalPrice: Math.max(0, basePrice - discountAmount),
    isEstimate: priceType === 'from',
  };
}

// ─── Cart pricing
export interface CartPricing {
  /** Sum of items that have a price (fixed + starting prices). */
  subtotal: number;
  /** Sum of fixed-price items only: what the promo can discount. */
  discountableAmount: number;
  discountAmount: number;
  total: number;
  /** true when some items have a starting price or no price yet. */
  isEstimate: boolean;
  hasQuoteItems: boolean;
}

export function getCartItemPriceType(item: CartItem): PriceType {
  if (item.priceType) return item.priceType;
  return item.price > 0 ? 'fixed' : 'quote';
}

export function getCartPricing(items: CartItem[], discountApplied: boolean): CartPricing {
  let subtotal = 0;
  let discountableAmount = 0;
  let isEstimate = false;
  let hasQuoteItems = false;

  for (const item of items) {
    const type = getCartItemPriceType(item);
    if (type === 'quote') {
      hasQuoteItems = true;
      isEstimate = true;
      continue;
    }
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    if (type === 'fixed') discountableAmount += lineTotal;
    else isEstimate = true;
  }

  const discountAmount = discountApplied ? discountableAmount : 0;

  return {
    subtotal,
    discountableAmount,
    discountAmount,
    total: Math.max(0, subtotal - discountAmount),
    isEstimate,
    hasQuoteItems,
  };
}

// ─── Service → order modal data
export function serviceToOrderModalData(service: Service): OrderModalData {
  return {
    emoji: service.emoji,
    name: service.name,
    desc: service.desc,
    price: service.price,
    numericPrice: service.numericPrice,
    priceType: service.priceType,
    options: service.options,
    serviceId: service.id,
  };
}

/** Text for an order total: handles "no price yet" and starting prices. */
export function describeTotal(
  total: number | null,
  isEstimate: boolean,
  format: (amount: number) => string
): string {
  if (total == null) return 'السعر يتحدد بعد التأكيد';
  return isEstimate ? `من ${format(total)}` : format(total);
}
