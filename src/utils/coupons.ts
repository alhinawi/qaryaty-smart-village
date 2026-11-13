// ─── قسايم (coupons): the rules, shared by the cart, the order screen and قسايمي
//
// The database (public.coupon_quote, used by orders_before_insert) is the judge:
// it checks every coupon again and works out the discount itself when the order
// is saved. This file is the same rule on the device, so the screens show the
// same number before the order is sent. Keep the two in step.
//
// The four kinds:
//   waive_fees     عمولة التطبيق is not charged (QARYA1). The price is paid in full.
//   percent        value% off the items or the service price, up to max_discount.
//   fixed          value EGP off the items or the service price (never below 0).
//   free_delivery  رسوم التوصيل is not charged (shop orders only), up to max_discount.
// The commission is always worked out on the full price: the discount is the app's.

export type CouponKind = 'waive_fees' | 'percent' | 'fixed' | 'free_delivery';
export type CouponTarget = 'products' | 'services' | 'both';
/** What an order is: a cart from a shop (products) or a service. */
export type OrderTarget = 'products' | 'services';

export interface Coupon {
  id: number;
  code: string;
  title: string;
  description: string;
  kind: CouponKind;
  /** percent: 1 to 100; fixed: EGP; unused for the other kinds. */
  value: number;
  /** The most the coupon takes off (null: no cap). */
  maxDiscount: number | null;
  /** The items or the service price must be at least this (0: any). */
  minOrder: number;
  appliesTo: CouponTarget;
  /** Only for orders from this shop (null: any). */
  shopId: number | null;
  shopName?: string | null;
  firstOrderOnly: boolean;
  /** Times one account may use it (null: no limit). */
  perUserLimit: number | null;
  /** Times it may be used by everyone together (null: no limit). */
  totalLimit: number | null;
  /** ISO date-times (null: open). */
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  /** Shown on قسايمي. A hidden coupon still works for whoever has the code. */
  isPublic: boolean;
}

/** A coupon on قسايمي, with what this person did with it. */
export interface MyCoupon extends Coupon {
  usedByMe: number;
  /** Used up by everyone (total_limit reached). */
  soldOut: boolean;
  /** This account already has orders (a first-order coupon is no longer theirs). */
  hasOrders: boolean;
}

/** What one order costs before the coupon. */
export interface OrderMoney {
  target: OrderTarget;
  shopId: number | null;
  /** The items or the service price; null when it's set after confirmation. */
  items: number | null;
  /** عمولة التطبيق on that price. */
  commission: number;
  /** رسوم التوصيل (0 for services). */
  delivery: number;
}

export interface CouponEffect {
  itemsOff: number;
  commissionOff: number;
  deliveryOff: number;
  /** Everything the coupon saves the customer. */
  total: number;
}

export const NO_EFFECT: CouponEffect = { itemsOff: 0, commissionOff: 0, deliveryOff: 0, total: 0 };

export const COUPON_CODE_PATTERN = /^[A-Z0-9]{3,20}$/;

export function normalizeCouponCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}

function capped(amount: number, cap: number | null): number {
  return cap == null ? amount : Math.min(amount, cap);
}

/** What the coupon takes off this order. Same rule as public.coupon_quote(). */
export function couponEffect(coupon: Pick<Coupon, 'kind' | 'value' | 'maxDiscount'>, money: OrderMoney): CouponEffect {
  const items = money.items ?? 0;
  let itemsOff = 0;
  let commissionOff = 0;
  let deliveryOff = 0;
  switch (coupon.kind) {
    case 'waive_fees':
      commissionOff = capped(Math.max(money.commission, 0), coupon.maxDiscount);
      break;
    case 'percent':
      itemsOff = Math.min(capped(Math.round((items * coupon.value) / 100), coupon.maxDiscount), items);
      break;
    case 'fixed':
      itemsOff = Math.min(capped(coupon.value, coupon.maxDiscount), items);
      break;
    case 'free_delivery':
      deliveryOff = capped(Math.max(money.delivery, 0), coupon.maxDiscount);
      break;
  }
  itemsOff = Math.max(itemsOff, 0);
  return { itemsOff, commissionOff, deliveryOff, total: itemsOff + commissionOff + deliveryOff };
}

const egp = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} ج`;

/** "5 نوفمبر" in Cairo time */
export function couponDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG-u-nu-latn', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Cairo',
  });
}

export interface CouponUsage {
  /** Signed in to an account. */
  signedIn: boolean;
  /** The account (or this device, for guests in demo mode) already has orders. */
  hasOrders: boolean;
  usedByMe: number;
  soldOut: boolean;
}

/**
 * Why this coupon can't go on this order, as the customer reads it, or null when
 * it can. Same checks and words as public.coupon_quote().
 */
export function couponProblem(
  coupon: Coupon,
  money: OrderMoney,
  usage: CouponUsage,
  now: Date = new Date()
): string | null {
  if (!coupon.active) return 'الكوبون ده متوقف دلوقتي';
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return `الكوبون ده لسه مابدأش، هيشتغل من ${couponDate(coupon.startsAt)}`;
  }
  if (coupon.endsAt && new Date(coupon.endsAt) <= now) return 'الكوبون ده خلصت مدته';
  if (coupon.appliesTo !== 'both' && coupon.appliesTo !== money.target) {
    return coupon.appliesTo === 'products' ? 'الكوبون ده لطلبات المحلات بس' : 'الكوبون ده للخدمات بس';
  }
  if (coupon.shopId != null && coupon.shopId !== money.shopId) {
    return coupon.shopName ? `الكوبون ده لطلبات ${coupon.shopName} بس` : 'الكوبون ده لمحل تاني';
  }
  if ((coupon.firstOrderOnly || coupon.perUserLimit != null) && !usage.signedIn) {
    return 'سجّل دخول الأول علشان تستخدم الكوبون ده';
  }
  if (coupon.firstOrderOnly && usage.hasOrders) return 'الكوبون ده لأول طلب بس، وإنت طلبت قبل كده';
  if (coupon.perUserLimit != null && usage.usedByMe >= coupon.perUserLimit) {
    return coupon.perUserLimit === 1
      ? 'إنت استخدمت الكوبون ده قبل كده'
      : `إنت استخدمت الكوبون ده ${coupon.perUserLimit} مرات، وده آخره`;
  }
  if (usage.soldOut) return 'الكوبون ده خلص، اتستخدم لآخر عدد';
  if (coupon.minOrder > 0 && (money.items ?? 0) < coupon.minOrder) {
    return `الكوبون ده لطلب من ${egp(coupon.minOrder)} أو أكتر`;
  }
  if ((coupon.kind === 'percent' || coupon.kind === 'fixed') && money.items == null) {
    return 'الكوبون ده محتاج طلب سعره معروف، والسعر هنا بيتحدد بعد التأكيد';
  }
  if (coupon.kind === 'free_delivery' && money.delivery <= 0) return 'مفيش رسوم توصيل على الطلب ده';
  return null;
}

/** The big line on the card: what the coupon gives. */
export function couponHeadline(coupon: Pick<Coupon, 'kind' | 'value' | 'maxDiscount'>): string {
  switch (coupon.kind) {
    case 'waive_fees':
      return 'من غير رسوم التطبيق';
    case 'percent':
      return `خصم ${coupon.value}%`;
    case 'fixed':
      return `خصم ${egp(coupon.value)}`;
    case 'free_delivery':
      return 'توصيل ببلاش';
  }
}

/** The conditions under the headline, one short line each. */
export function couponConditions(coupon: Coupon): string[] {
  const lines: string[] = [];
  if (coupon.maxDiscount != null && coupon.kind !== 'fixed') lines.push(`لحد ${egp(coupon.maxDiscount)}`);
  if (coupon.minOrder > 0) lines.push(`لطلب من ${egp(coupon.minOrder)} أو أكتر`);
  if (coupon.shopId != null) lines.push(coupon.shopName ? `لطلبات ${coupon.shopName} بس` : 'لمحل واحد بس');
  else if (coupon.appliesTo === 'products') lines.push('لطلبات المحلات');
  else if (coupon.appliesTo === 'services') lines.push('للخدمات');
  if (coupon.firstOrderOnly) lines.push('لأول طلب بس');
  else if (coupon.perUserLimit === 1) lines.push('مرة واحدة لكل حساب');
  else if (coupon.perUserLimit != null) lines.push(`${coupon.perUserLimit} مرات لكل حساب`);
  if (coupon.totalLimit != null) lines.push(`لأول ${coupon.totalLimit} طلب`);
  return lines;
}

export type CouponStatus = 'available' | 'upcoming' | 'used' | 'expired' | 'sold_out' | 'off';

/** Where the coupon stands for this person on قسايمي. */
export function couponStatus(coupon: MyCoupon, signedIn: boolean, now: Date = new Date()): CouponStatus {
  if (!coupon.active) return 'off';
  if (coupon.endsAt && new Date(coupon.endsAt) <= now) return 'expired';
  if (signedIn && coupon.firstOrderOnly && coupon.hasOrders) return 'used';
  if (signedIn && coupon.perUserLimit != null && coupon.usedByMe >= coupon.perUserLimit) return 'used';
  if (coupon.soldOut) return 'sold_out';
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return 'upcoming';
  return 'available';
}

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  available: 'متاح',
  upcoming: 'قريب',
  used: 'استخدمته',
  expired: 'خلصت مدته',
  sold_out: 'خلص',
  off: 'متوقف',
};

/** "لحد 30 نوفمبر", "من 10 نوفمبر" or "" for an open coupon. */
export function couponExpiry(coupon: Pick<Coupon, 'startsAt' | 'endsAt'>, now: Date = new Date()): string {
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return `يبدأ ${couponDate(coupon.startsAt)}`;
  if (coupon.endsAt) {
    return new Date(coupon.endsAt) <= now ? `خلص ${couponDate(coupon.endsAt)}` : `لحد ${couponDate(coupon.endsAt)}`;
  }
  return 'من غير تاريخ انتهاء';
}

/** Available ones first (soonest to end first), then upcoming, then the rest. */
export function sortMyCoupons(list: MyCoupon[], signedIn: boolean, now: Date = new Date()): MyCoupon[] {
  const rank: Record<CouponStatus, number> = { available: 0, upcoming: 1, used: 2, sold_out: 3, expired: 4, off: 5 };
  const end = (c: MyCoupon) => (c.endsAt ? new Date(c.endsAt).getTime() : Number.MAX_SAFE_INTEGER);
  return [...list].sort(
    (a, b) =>
      rank[couponStatus(a, signedIn, now)] - rank[couponStatus(b, signedIn, now)] || end(a) - end(b) || a.id - b.id
  );
}

// ─── Admin form
export interface CouponDraft {
  code: string;
  title: string;
  description: string;
  kind: CouponKind;
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  appliesTo: CouponTarget;
  shopId: number | null;
  firstOrderOnly: boolean;
  perUserLimit: number | null;
  totalLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  isPublic: boolean;
}

export const COUPON_KIND_LABEL: Record<CouponKind, string> = {
  waive_fees: 'من غير رسوم التطبيق',
  percent: 'خصم نسبة من السعر',
  fixed: 'خصم مبلغ ثابت',
  free_delivery: 'توصيل ببلاش',
};

export const COUPON_TARGET_LABEL: Record<CouponTarget, string> = {
  both: 'المحلات والخدمات',
  products: 'طلبات المحلات بس',
  services: 'الخدمات بس',
};

/** The first thing wrong with the form, or null. Same limits as the coupons table. */
export function draftProblem(d: CouponDraft): string | null {
  if (!COUPON_CODE_PATTERN.test(d.code)) return 'الكود من 3 لـ 20 حرف إنجليزي كابيتال أو رقم، من غير مسافات';
  if (d.title.trim().length < 2 || d.title.length > 80) return 'اكتب عنوان للكوبون (لحد 80 حرف)';
  if (d.description.length > 300) return 'الوصف لحد 300 حرف';
  if (d.kind === 'percent' && !(d.value > 0 && d.value <= 100)) return 'النسبة لازم تبقى من 1 لـ 100';
  if (d.kind === 'fixed' && !(d.value > 0 && d.value <= 100000)) return 'اكتب مبلغ الخصم';
  if (d.maxDiscount != null && !(d.maxDiscount > 0)) return 'أقصى خصم لازم يبقى أكبر من صفر، أو سيبه فاضي';
  if (!(d.minOrder >= 0)) return 'أقل طلب لازم يبقى صفر أو أكتر';
  if (d.perUserLimit != null && !(Number.isInteger(d.perUserLimit) && d.perUserLimit >= 1)) {
    return 'عدد المرات لكل حساب لازم يبقى 1 أو أكتر، أو سيبه فاضي';
  }
  if (d.totalLimit != null && !(Number.isInteger(d.totalLimit) && d.totalLimit >= 1)) {
    return 'العدد الكلي لازم يبقى 1 أو أكتر، أو سيبه فاضي';
  }
  if (d.startsAt && d.endsAt && new Date(d.endsAt) <= new Date(d.startsAt)) return 'تاريخ النهاية لازم يبقى بعد البداية';
  if (d.kind === 'free_delivery' && d.appliesTo !== 'products') return 'التوصيل ببلاش لطلبات المحلات بس';
  if (d.shopId != null && d.appliesTo !== 'products') return 'كوبون محل معيّن لازم يبقى لطلبات المحلات بس';
  return null;
}

export function emptyDraft(): CouponDraft {
  return {
    code: '',
    title: '',
    description: '',
    kind: 'percent',
    value: 10,
    maxDiscount: null,
    minOrder: 0,
    appliesTo: 'both',
    shopId: null,
    firstOrderOnly: false,
    perUserLimit: 1,
    totalLimit: null,
    startsAt: null,
    endsAt: null,
    active: true,
    isPublic: true,
  };
}

export function couponToDraft(c: Coupon): CouponDraft {
  return {
    code: c.code,
    title: c.title,
    description: c.description,
    kind: c.kind,
    value: c.value,
    maxDiscount: c.maxDiscount,
    minOrder: c.minOrder,
    appliesTo: c.appliesTo,
    shopId: c.shopId,
    firstOrderOnly: c.firstOrderOnly,
    perUserLimit: c.perUserLimit,
    totalLimit: c.totalLimit,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    active: c.active,
    isPublic: c.isPublic,
  };
}
