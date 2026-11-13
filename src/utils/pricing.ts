// ─── Imports
import type {
  CartItem,
  ChoicePrice,
  Order,
  OrderModalData,
  PriceType,
  Provider,
  ProviderMode,
  QuantityRule,
  Service,
  ServiceOption,
} from '@/types';
import { STAGE_LABELS } from '@/data/teachers';
import { APP_COMMISSION_MAX, APP_COMMISSION_MIN, APP_COMMISSION_PERCENT } from '@/config/commission';
import { teacherLessonOptions } from './teacherGroups';
import { couponEffect, type Coupon } from './coupons';

// ─── Promo code
// The first-order code waives the fees only: عمولة التطبيق is not charged, and
// the customer pays the price of the items or the service in full. The server
// (orders_before_insert) waives it itself and allows the code once per account;
// this check on the device is only a UX guard.
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
  return { ok: true, code };
}

/** What the order screens say about the code. */
export const FIRST_ORDER_PROMO_TEXT = 'أول طلب من غير رسوم';
export const FIRST_ORDER_PROMO_APPLIED = `🎉 كود ${FIRST_ORDER_PROMO} اتفعّل: أول طلب من غير عمولة التطبيق. رسوم التوصيل بتروح للمندوب، فبتتدفع عادي`;
/** The line in the price breakdown when the fees are waived. */
/** The waived-commission line: «رسوم التطبيق (كوبون QARYA1)». */
export const WAIVED_FEES_LABEL = (code: string = FIRST_ORDER_PROMO) => `رسوم التطبيق (كوبون ${code})`;

// ─── Coupons on a price
/**
 * The coupon on an order: a coupon from the coupons table, or true for the
 * legacy first-order code (waives عمولة التطبيق only). Rules in ./coupons.ts.
 */
export type PricingCoupon = Pick<Coupon, 'kind' | 'value' | 'maxDiscount'> | boolean | null | undefined;

const WAIVE_FEES: Pick<Coupon, 'kind' | 'value' | 'maxDiscount'> = { kind: 'waive_fees', value: 0, maxDiscount: null };

function asCoupon(coupon: PricingCoupon): Pick<Coupon, 'kind' | 'value' | 'maxDiscount'> | null {
  if (coupon === true) return WAIVE_FEES;
  return coupon || null;
}

// ─── App commission
/**
 * The app's fee for one order: APP_COMMISSION_PERCENT of what the order costs,
 * rounded to the nearest pound, kept between APP_COMMISSION_MIN and
 * APP_COMMISSION_MAX. Nothing when there is nothing to pay or no price yet
 * (set after confirmation). The first-order code waives it (see getOrderPricing).
 * Same rule as public.order_commission() in supabase/schema.sql.
 */
export function appCommission(order: {
  /** What the order costs; null when set after confirmation. */
  payable: number | null;
  isEstimate: boolean;
}): number {
  const { payable } = order;
  if (payable == null || !Number.isFinite(payable) || payable <= 0) return 0;
  // Whole piastres first, so 0.1 + 0.2 style float noise can't tip the rounding
  const piastres = Math.round(payable * 100);
  const percentOf = Math.round((piastres * APP_COMMISSION_PERCENT) / 10000);
  return Math.min(APP_COMMISSION_MAX, Math.max(APP_COMMISSION_MIN, percentOf));
}

// ─── Single service pricing (OrderModal)
export interface OrderPricing {
  priceType: PriceType;
  /** Price shown as the service price; null when it is set after confirmation. */
  basePrice: number | null;
  /** Everything the coupon took off (the commission it waived, or the price discount). */
  discountAmount: number;
  /** true when a fees coupon (QARYA1) is on: no commission, now or when the price is set later. */
  feesWaived: boolean;
  /** What a price coupon took off the price itself. */
  priceDiscount: number;
  /** The price before any coupon (the server works from this). null when set after confirmation. */
  fullPrice: number | null;
  /** عمولة التطبيق before any coupon. */
  fullCommission: number;
  /** The price of the order itself after a price coupon. null when set after confirmation. */
  finalPrice: number | null;
  isEstimate: boolean;
  /** Price of one unit after the choices (null: set after confirmation). */
  unitPrice: number | null;
  /** How many units are ordered (1 when there is no quantity box). */
  amount: number;
  /** Added once on top (delivering a gas cylinder). */
  deliveryFee: number;
  /** What the picked choice says about the price, e.g. "معاينة 100 ج" or "360 ج/الشهر". */
  priceLabel?: string;
  /** عمولة التطبيق charged, shown at the payment step only (0 with the first-order code). */
  commission: number;
  /** finalPrice plus the commission: what the customer pays. null when set after confirmation. */
  totalToPay: number | null;
}

export function resolvePriceType(data: {
  numericPrice?: number | null;
  priceType?: PriceType;
}): PriceType {
  if (data.numericPrice == null || data.numericPrice <= 0) return 'quote';
  return data.priceType ?? 'fixed';
}

/** Options to ask now: one with `showWhen` appears only after its trigger answer. */
export function visibleOptions(
  options: ServiceOption[] | undefined,
  selections: Record<string, string>
): ServiceOption[] {
  return (options ?? []).filter(
    (option) => !option.showWhen || selections[option.showWhen.optionId] === option.showWhen.choice
  );
}

/** The unit for the current answers (hours for a private lesson, months for a group), with its price. */
export function resolveQuantity(
  rule: QuantityRule | undefined,
  selections: Record<string, string>
): { unit: string; price?: number; priceLabel?: string } | null {
  if (!rule) return null;
  const variant = rule.byChoice && rule.byChoice.variants[selections[rule.byChoice.optionId] ?? ''];
  return variant ?? { unit: rule.unit };
}

/** The last picked choice that sets the price itself (معاينة الأول, a group's monthly fee). */
export function choicePriceOverride(
  options: ServiceOption[] | undefined,
  selections: Record<string, string>
): ChoicePrice | undefined {
  let found: ChoicePrice | undefined;
  for (const option of visibleOptions(options, selections)) {
    const priced = option.prices?.[selections[option.id] ?? ''];
    if (priced) found = priced;
  }
  return found;
}

/**
 * Price of one unit for the current answers: the unit's own price (group month)
 * or the service price, plus what the picked choices add (the fish per kilo).
 */
export function unitPrice(
  data: Pick<OrderModalData, 'numericPrice' | 'options' | 'quantity'>,
  selections: Record<string, string>
): number | null | undefined {
  const override = choicePriceOverride(data.options, selections);
  const base = override ? override.price : (resolveQuantity(data.quantity, selections)?.price ?? data.numericPrice);
  if (base == null) return base;
  const extra = visibleOptions(data.options, selections).reduce(
    (sum, option) => sum + (option.choicePrices?.[selections[option.id] ?? ''] ?? 0),
    0
  );
  return base + extra;
}

export function getOrderPricing(
  data: Pick<OrderModalData, 'numericPrice' | 'priceType'> &
    Partial<Pick<OrderModalData, 'options' | 'quantity' | 'deliveryFee'>>,
  discount: PricingCoupon,
  order: { selections?: Record<string, string>; quantity?: number } = {}
): OrderPricing {
  const coupon = asCoupon(discount);
  const selections = order.selections ?? {};
  const perUnit = unitPrice(data, selections);
  const amount = data.quantity ? (order.quantity ?? data.quantity.min) : 1;
  const priced = perUnit == null ? perUnit : Math.round(perUnit * amount * 100) / 100;
  const override = choicePriceOverride(data.options, selections);
  const declared = override ? (override.priceType ?? (override.price == null ? 'quote' : data.priceType)) : data.priceType;
  const priceType = resolvePriceType({ numericPrice: priced, priceType: declared });
  const deliveryFee = data.deliveryFee ?? 0;
  const priceLabel = override?.label ?? resolveQuantity(data.quantity, selections)?.priceLabel;
  const extra = { amount, deliveryFee, priceLabel };

  if (priceType === 'quote') {
    return {
      priceType,
      basePrice: null,
      discountAmount: 0,
      feesWaived: coupon?.kind === 'waive_fees',
      priceDiscount: 0,
      fullPrice: null,
      fullCommission: 0,
      finalPrice: null,
      isEstimate: false,
      unitPrice: null,
      commission: 0,
      totalToPay: null,
      ...extra,
    };
  }

  const basePrice = (priced as number) + deliveryFee;
  const isEstimate = priceType === 'from';
  // The commission is on the full price; a coupon comes off after it
  const fee = appCommission({ payable: basePrice, isEstimate });
  const effect = coupon
    ? couponEffect(coupon, { target: 'services', shopId: null, items: basePrice, commission: fee, delivery: 0 })
    : null;
  const commission = fee - (effect?.commissionOff ?? 0);
  const finalPrice = basePrice - (effect?.itemsOff ?? 0);

  return {
    priceType,
    basePrice,
    discountAmount: effect?.total ?? 0,
    feesWaived: coupon?.kind === 'waive_fees',
    priceDiscount: effect?.itemsOff ?? 0,
    fullPrice: basePrice,
    fullCommission: fee,
    finalPrice,
    isEstimate,
    unitPrice: perUnit ?? null,
    commission,
    totalToPay: finalPrice + commission,
    ...extra,
  };
}

// ─── Cart pricing
export interface CartPricing {
  /** Sum of items that have a price (fixed + starting prices). */
  subtotal: number;
  /** Everything the coupon took off (commission, items and delivery together). */
  discountAmount: number;
  /** true when a fees coupon (QARYA1) is on. */
  feesWaived: boolean;
  /** What a price coupon took off the items. */
  itemsDiscount: number;
  /** What a free-delivery coupon took off رسوم التوصيل. */
  deliveryDiscount: number;
  /** عمولة التطبيق before any coupon (the server starts from this). */
  fullCommission: number;
  /** What the items cost after a price coupon. */
  total: number;
  /** true when some items have a starting price or no price yet. */
  isEstimate: boolean;
  hasQuoteItems: boolean;
  /** عمولة التطبيق charged, shown at checkout only (0 with the first-order code). */
  commission: number;
  /** رسوم التوصيل charged: a shop cart only, never waived by QARYA1, waived by a free-delivery coupon. */
  deliveryFee: number;
  /** total plus the commission and the delivery fee. null when nothing in the cart has a price yet. */
  totalToPay: number | null;
}

export function getCartItemPriceType(item: CartItem): PriceType {
  if (item.priceType) return item.priceType;
  return item.price > 0 ? 'fixed' : 'quote';
}

/**
 * The cart's breakdown. `deliveryFee` is رسوم التوصيل for a shop cart (0 for a
 * service cart): it is added on top, the commission is on the items only, and the
 * first-order code doesn't waive it. Same rule as orders_before_insert.
 */
export function getCartPricing(items: CartItem[], discount: PricingCoupon, deliveryFee = 0): CartPricing {
  const coupon = asCoupon(discount);
  let subtotal = 0;
  let isEstimate = false;
  let hasQuoteItems = false;

  for (const item of items) {
    const type = getCartItemPriceType(item);
    if (type === 'quote') {
      hasQuoteItems = true;
      isEstimate = true;
      continue;
    }
    subtotal += item.price * item.quantity;
    if (type !== 'fixed') isEstimate = true;
  }

  const unpriced = subtotal === 0 && hasQuoteItems;
  deliveryFee = Number.isFinite(deliveryFee) && deliveryFee > 0 ? deliveryFee : 0;
  // The commission is on the full price; a coupon comes off after it
  const fee = appCommission({ payable: unpriced ? null : subtotal, isEstimate });
  const effect = coupon
    ? couponEffect(coupon, {
        target: 'products',
        shopId: null,
        items: unpriced ? null : subtotal,
        commission: fee,
        delivery: deliveryFee,
      })
    : null;
  const commission = fee - (effect?.commissionOff ?? 0);
  const total = subtotal - (effect?.itemsOff ?? 0);
  const deliveryCharged = deliveryFee - (effect?.deliveryOff ?? 0);

  return {
    subtotal,
    discountAmount: effect?.total ?? 0,
    feesWaived: coupon?.kind === 'waive_fees',
    itemsDiscount: effect?.itemsOff ?? 0,
    deliveryDiscount: effect?.deliveryOff ?? 0,
    total,
    isEstimate,
    hasQuoteItems,
    commission,
    fullCommission: fee,
    deliveryFee: deliveryCharged,
    totalToPay: unpriced ? null : total + commission + deliveryCharged,
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
    quantity: service.quantity,
    serviceId: service.id,
  };
}

/** Booking a specific teacher/nurse/doctor: the provider's price, the service's choices. */
export function providerToOrderModalData(
  provider: Provider,
  service?: Service,
  preselected?: Record<string, string>
): OrderModalData {
  const base = service?.options ? providerOptions(provider, service.options) : [];
  const options = withInspectionFee(provider, teacherLessonOptions(provider, base));
  return {
    emoji: service?.emoji ?? '👤',
    name: service ? `${service.name} مع ${provider.name}` : provider.name,
    desc: provider.bio,
    price: provider.price,
    numericPrice: provider.numericPrice,
    priceType: provider.priceType,
    options: options.length ? options : undefined,
    quantity: service?.quantity,
    serviceId: provider.serviceId,
    providerId: provider.id,
    deliveryFee: provider.deliveryFee,
    preselected,
  };
}

export const VISIT_INSPECTION = 'معاينة الأول';

/** A worker's own inspection fee replaces the service's usual one. */
function withInspectionFee(provider: Provider, options: ServiceOption[]): ServiceOption[] {
  const fee = provider.inspectionFee;
  if (fee === undefined) return options;
  return options.map((option) =>
    option.prices?.[VISIT_INSPECTION]
      ? {
          ...option,
          prices: {
            ...option.prices,
            [VISIT_INSPECTION]: { price: fee, priceType: 'fixed' as const, label: fee === 0 ? 'معاينة مجانية' : `معاينة ${fee} ج` },
          },
        }
      : option
  );
}

const MODE_CHOICES: Record<ProviderMode, string[]> = {
  home: ['في البيت', 'زيارة في البيت', 'في بيتك'],
  teacher_home: ['في بيت المدرس'],
  center: ['في سنتر'],
  online: ['أونلاين'],
  clinic: ['حجز في العيادة'],
};

/**
 * Booking a specific person: only offer the choices that person really has
 * (the stages a teacher teaches, home/online, ممرض or ممرضة). A choice left alone is preselected
 * by the order form. If nothing matches, the service's choices stay as they are.
 */
export function providerOptions(provider: Provider, options: ServiceOption[]): ServiceOption[] {
  const keep = (option: ServiceOption, allowed: string[]): ServiceOption => {
    const choices = option.choices.filter((choice) => allowed.includes(choice));
    return choices.length ? { ...option, choices } : option;
  };
  return options.map((option) => {
    switch (option.id) {
      case 'stage':
        return provider.stages ? keep(option, provider.stages.map((st) => STAGE_LABELS[st])) : option;
      case 'mode':
      case 'visit':
        return keep(option, provider.modes.flatMap((m) => MODE_CHOICES[m]));
      case 'gender':
        return keep(option, [provider.gender === 'female' ? 'ممرضة' : 'ممرض']);
      default:
        return option;
    }
  });
}

/**
 * Text for an order total: handles "no price yet" and starting prices.
 * With `commissionPercent`, a price set after confirmation says the app's
 * commission comes on top of it.
 */
export function describeTotal(
  total: number | null,
  isEstimate: boolean,
  format: (amount: number) => string,
  commissionPercent = 0
): string {
  if (total == null) {
    return commissionPercent > 0
      ? `السعر يتحدد بعد التأكيد + عمولة ${commissionPercent}%`
      : 'السعر يتحدد بعد التأكيد';
  }
  return isEstimate ? `من ${format(total)}` : format(total);
}
