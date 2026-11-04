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
import { teacherLessonOptions } from './teacherGroups';

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
  /** Price of one unit after the choices (null: set after confirmation). */
  unitPrice: number | null;
  /** How many units are ordered (1 when there is no quantity box). */
  amount: number;
  /** Added once on top (delivering a gas cylinder). */
  deliveryFee: number;
  /** What the picked choice says about the price, e.g. "معاينة 100 ج" or "360 ج/الشهر". */
  priceLabel?: string;
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
  discountApplied: boolean,
  order: { selections?: Record<string, string>; quantity?: number } = {}
): OrderPricing {
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
      discountableAmount: 0,
      discountAmount: 0,
      finalPrice: null,
      isEstimate: false,
      unitPrice: null,
      ...extra,
    };
  }

  const basePrice = (priced as number) + deliveryFee;
  const discountableAmount = priceType === 'fixed' ? basePrice : 0;
  const discountAmount = discountApplied ? discountableAmount : 0;

  return {
    priceType,
    basePrice,
    discountableAmount,
    discountAmount,
    finalPrice: Math.max(0, basePrice - discountAmount),
    isEstimate: priceType === 'from',
    unitPrice: perUnit ?? null,
    ...extra,
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

/** Text for an order total: handles "no price yet" and starting prices. */
export function describeTotal(
  total: number | null,
  isEstimate: boolean,
  format: (amount: number) => string
): string {
  if (total == null) return 'السعر يتحدد بعد التأكيد';
  return isEstimate ? `من ${format(total)}` : format(total);
}
