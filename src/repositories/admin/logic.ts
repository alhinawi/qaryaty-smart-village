// ─── Admin dashboard: the small rules, kept here so they're tested
import type {
  AdminMoney,
  AdminOrder,
  AdminOrderFilter,
  AdminOrderItem,
  AdminOrderStatus,
  AdminOverview,
  DonationStatus,
} from './types';

export const ORDER_STATUSES: AdminOrderStatus[] = ['pending', 'confirmed', 'onway', 'done', 'cancelled'];

export const ORDER_STATUS_LABEL: Record<AdminOrderStatus, string> = {
  pending: 'مستني تأكيد',
  confirmed: 'اتأكد',
  onway: 'في الطريق',
  done: 'اتسلّم',
  cancelled: 'اتلغى',
};

export const ORDER_STATUS_TONE: Record<AdminOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  onway: 'bg-indigo-100 text-indigo-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

/** The one step forward from a status (the big button on an order), or null at the end. */
export function nextOrderStatus(status: AdminOrderStatus): AdminOrderStatus | null {
  switch (status) {
    case 'pending':
      return 'confirmed';
    case 'confirmed':
      return 'onway';
    case 'onway':
      return 'done';
    default:
      return null;
  }
}

export const NEXT_STATUS_ACTION: Record<AdminOrderStatus, string> = {
  pending: 'أكّد الطلب',
  confirmed: 'خرج للتوصيل',
  onway: 'اتسلّم',
  done: '',
  cancelled: '',
};

/** Only open orders can be cancelled; a delivered one stays delivered. */
export function canCancel(status: AdminOrderStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'onway';
}

export const DONATION_STATUS_LABEL: Record<DonationStatus, string> = {
  new: 'جديد',
  contacted: 'اتكلمنا معاه',
  done: 'خلص',
  cancelled: 'اتلغى',
};

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : num(v));
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

function money(raw: unknown): AdminMoney {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    orders: num(r.orders),
    revenue: num(r.revenue),
    commission: num(r.commission),
  };
}

/** admin_overview() jsonb → the dashboard's numbers (missing parts read as 0). */
export function overviewFromJson(raw: unknown): AdminOverview {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose jsonb from the RPC, every field goes through num()
  const r = (raw ?? {}) as Record<string, any>;
  const sc = (r.status_counts ?? {}) as Record<string, unknown>;
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, num(sc[s])])) as Record<
    AdminOrderStatus,
    number
  >;
  const u = r.users ?? {};
  const p = r.pending ?? {};
  const promo = r.promo ?? {};
  return {
    today: money(r.today),
    week: money(r.week),
    allTime: money(r.all_time),
    commissionDone: num(r.commission_done),
    statusCounts,
    users: {
      total: num(u.total),
      today: num(u.today),
      week: num(u.week),
      admins: num(u.admins),
      blocked: num(u.blocked),
    },
    pending: {
      orders: num(p.orders),
      jobs: num(p.jobs),
      donations: num(p.donations),
      marketHidden: num(p.market_hidden),
      ridesHidden: num(p.rides_hidden),
    },
    promo: { orders: num(promo.orders), feesWaived: num(promo.fees_waived) },
    villagesServed: num(r.villages_served),
  };
}

/** Total of the things waiting for the admin (the red badge on the overview). */
export function pendingTotal(o: AdminOverview): number {
  return o.pending.orders + o.pending.jobs + o.pending.donations + o.pending.marketHidden + o.pending.ridesHidden;
}

function itemFromJson(raw: unknown): AdminOrderItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    name: str(r.name) || str(r.product_id) || 'صنف',
    quantity: num(r.quantity ?? r.qty ?? 1),
    unit: str(r.unit) || undefined,
    price: r.price == null ? undefined : num(r.price),
    emoji: str(r.emoji) || undefined,
  };
}

export function orderFromJson(raw: unknown): AdminOrder {
  const r = (raw ?? {}) as Record<string, unknown>;
  const status = ORDER_STATUSES.includes(r.status as AdminOrderStatus) ? (r.status as AdminOrderStatus) : 'pending';
  return {
    id: str(r.id),
    orderNumber: str(r.order_number),
    createdAt: str(r.created_at),
    status,
    serviceName: str(r.service_name),
    serviceEmoji: str(r.service_emoji),
    phone: str(r.phone),
    address: str(r.address),
    notes: str(r.notes),
    paymentMethod: str(r.payment_method) || 'cash',
    paymentStatus: str(r.payment_status),
    items: Array.isArray(r.items) ? r.items.map(itemFromJson) : [],
    subtotal: numOrNull(r.subtotal_amount),
    deliveryFee: num(r.delivery_fee),
    commission: numOrNull(r.commission_amount),
    discount: numOrNull(r.discount_amount),
    discountCode: str(r.discount_code) || null,
    total: numOrNull(r.total_amount),
    cancelReason: str(r.cancel_reason) || null,
    customerName: str(r.customer_name),
    customerUsername: str(r.customer_username),
    customerVillage: str(r.customer_village),
  };
}

export type DatePreset = 'today' | 'week' | 'month' | 'all';

export const DATE_PRESET_LABEL: Record<DatePreset, string> = {
  today: 'النهارده',
  week: 'آخر 7 أيام',
  month: 'آخر 30 يوم',
  all: 'كل الوقت',
};

/** Cairo is UTC+2 in winter and UTC+3 in summer: read its offset for one instant. */
export function cairoOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}

/** Start of the Cairo day that `at` falls in, `daysBack` days earlier, as a Date. */
export function cairoDayStart(at: Date, daysBack = 0): Date {
  const offset = cairoOffsetMinutes(at);
  const local = new Date(at.getTime() + offset * 60000);
  const startLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysBack);
  const guess = new Date(startLocal - offset * 60000);
  // The offset can change between that day and today (summer time): correct once.
  const fixed = cairoOffsetMinutes(guess);
  return fixed === offset ? guess : new Date(startLocal - fixed * 60000);
}

/** A date preset → the from/to filter the server expects (Cairo days, to is exclusive). */
export function presetRange(preset: DatePreset, now = new Date()): Pick<AdminOrderFilter, 'from' | 'to'> {
  if (preset === 'all') return {};
  const back = preset === 'today' ? 0 : preset === 'week' ? 6 : 29;
  return { from: cairoDayStart(now, back).toISOString() };
}

/** The RPC's arguments: empty strings become null so the server skips that filter. */
export function orderFilterArgs(f: AdminOrderFilter, limit = 100) {
  const clean = (v?: string) => (v && v.trim() ? v.trim() : null);
  return {
    p_status: clean(f.status),
    p_from: clean(f.from),
    p_to: clean(f.to),
    p_village: clean(f.village),
    p_search: clean(f.search),
    p_limit: limit,
  };
}

export function formatEGP(n: number | null | undefined): string {
  if (n == null) return '—';
  const rounded = Math.round(n * 100) / 100;
  return `${rounded.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} جنيه`;
}

/** «50 جنيه», «من 50 جنيه», «بالاتفاق»: the price text the customer sees for a service or provider. */
export function priceText(priceType: 'fixed' | 'from' | 'quote', amount: number | null): string {
  if (priceType === 'quote' || amount == null || !(amount >= 0)) return 'بالاتفاق';
  const n = Math.round(amount * 100) / 100;
  return priceType === 'from' ? `من ${n} جنيه` : `${n} جنيه`;
}

/** A product id for a new catalog item: readable, unique within its list. */
export function newProductId(taken: Iterable<string>, now = Date.now()): string {
  const used = new Set(taken);
  const base = `adm-${now.toString(36)}`;
  let id = base;
  let i = 2;
  while (used.has(id)) id = `${base}-${i++}`;
  return id;
}

/** Reasons a catalog product can't be saved, or '' when it's fine. */
export function productProblem(p: { name: string; price: number; unit: string }): string {
  if (p.name.trim().length < 2) return 'اكتب اسم الصنف';
  if (!Number.isFinite(p.price) || p.price < 0) return 'السعر لازم يكون رقم مش بالسالب';
  if (!p.unit.trim()) return 'اكتب الوحدة (كيلو، قطعة، علبة…)';
  return '';
}

/** Shops of one kind share one product list; a restaurant has its own (same as public.shop_scope()). */
export function scopeForShop(shop: { id: number; kind: string }): string {
  return shop.kind === 'restaurant' ? `restaurant:${shop.id}` : shop.kind || 'other';
}

export const SHOP_KIND_LABEL: Record<string, string> = {
  grocery: 'بقالة وسوبر ماركت',
  bakery: 'فرن',
  veg: 'خضار',
  fruit: 'فاكهة',
  fish: 'سمك',
  butcher: 'جزارة',
  poultry: 'فراخ',
  sweets: 'حلواني',
  attar: 'عطارة',
  coffee: 'بن',
  dairy: 'ألبان',
  stationery: 'مكتبة',
  housewares: 'أدوات منزلية',
  pharmacy: 'صيدلية',
  restaurant: 'مطعم',
  other: 'تاني',
};

export const SERVICE_CAT_LABEL: Record<string, string> = {
  food: 'أكل',
  delivery: 'توصيل',
  craft: 'صنايعية',
  care: 'رعاية',
  edu: 'تعليم',
  health: 'صحة',
  home: 'البيت',
  finishing: 'تشطيبات',
};

export const PROVIDER_KIND_LABEL: Record<string, string> = {
  teacher: 'مدرس',
  nurse: 'تمريض',
  doctor: 'دكتور',
  babysitter: 'جليسة أطفال',
  cleaner: 'نظافة',
  worker: 'مقدم خدمة',
};

/** Users search: name, username, phone, email or village; Arabic spelling differences don't matter. */
export function userMatches(
  u: {
    name?: string;
    username?: string;
    phone?: string;
    email?: string;
    village?: string;
  },
  query: string,
  normalize: (s: string) => string,
): boolean {
  const q = normalize(query.trim().toLowerCase());
  if (!q) return true;
  return [u.name, u.username, u.phone, u.email, u.village].some((f) => normalize((f ?? '').toLowerCase()).includes(q));
}

/** Highest fee the database accepts for a shop or a village (shops/villages_delivery_fee_sane). */
export const MAX_DELIVERY_FEE = 1000;

/**
 * A delivery fee typed by the admin. Empty means "none" (null) when `allowEmpty`,
 * otherwise it's a problem. Returns the number or a message.
 */
export function parseDeliveryFee(
  text: string,
  allowEmpty: boolean,
  max = MAX_DELIVERY_FEE,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = text
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace('٫', '.');
  if (!t) return allowEmpty ? { ok: true, value: null } : { ok: false, error: 'اكتب رقم' };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, error: 'اكتب رقم صحيح' };
  if (n < 0) return { ok: false, error: 'الرسوم مايتنفعش تبقى بالسالب' };
  if (n > max) return { ok: false, error: `أقصى رسوم ${max} جنيه` };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

/** Same rule as public.delivery_fee_quote(): the shop's fee (or the default), raised to the village's fee when higher. */
export function deliveryFeeFor(defaultFee: number, shopFee: number | null, villageFee: number | null): number {
  const base = shopFee ?? defaultFee;
  return Math.max(base, villageFee ?? 0);
}
