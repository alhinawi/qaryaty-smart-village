// ─── بيع المستعمل وتبادل: labels, the safety note and the small rules the pages share
// The database (supabase/migrations/20261106180000_market.sql) enforces the same rules.
import { matchesSearch } from '@/utils/arabicSearch';
import type {
  ListingCategory,
  ListingCondition,
  ListingDraft,
  ListingKind,
  ListingReportReason,
  MarketListing,
} from '@/repositories/market/types';

/** A post shows this long, then the owner renews it */
export const LISTING_DAYS = 30;
/** Renew opens this many days before the post ends (and stays open after it ends) */
export const LISTING_RENEW_WINDOW_DAYS = 7;
export const MAX_PHOTOS = 5;
export const MAX_PRICE = 50_000_000;

export const KIND_INFO: Record<ListingKind, { title: string; icon: string; tagline: string; done: string; doneAction: string }> = {
  sale: {
    title: 'بيع المستعمل',
    icon: '🏷️',
    tagline: 'بيع أي حاجة مش محتاجها، أو اشتري مستعمل نضيف من أهل القرية.',
    done: 'اتباع',
    doneAction: 'اتباعت ✔️',
  },
  swap: {
    title: 'تبادل',
    icon: '🔄',
    tagline: 'بدّل حاجة عندك مش محتاجها بحاجة محتاجها، من غير فلوس.',
    done: 'اتبدّل',
    doneAction: 'اتبدّلت ✔️',
  },
};

export const LISTING_CATEGORIES: { id: ListingCategory; label: string; icon: string }[] = [
  { id: 'devices', label: 'أجهزة', icon: '📺' },
  { id: 'phones', label: 'موبايلات', icon: '📱' },
  { id: 'furniture', label: 'أثاث', icon: '🛋️' },
  { id: 'clothes', label: 'هدوم', icon: '👕' },
  { id: 'vehicles', label: 'عربيات وموتوسيكلات', icon: '🏍️' },
  { id: 'tools', label: 'أدوات', icon: '🛠️' },
  { id: 'books', label: 'كتب', icon: '📚' },
  { id: 'kids', label: 'حاجات أطفال', icon: '🧸' },
  { id: 'other', label: 'تانية', icon: '📦' },
];

export const LISTING_CONDITIONS: { id: ListingCondition; label: string }[] = [
  { id: 'new', label: 'جديد' },
  { id: 'good', label: 'كويس' },
  { id: 'used', label: 'مستعمل' },
];

export const LISTING_REPORT_REASONS: { id: ListingReportReason; label: string }[] = [
  { id: 'scam', label: 'نصب أو بيطلب فلوس مقدم' },
  { id: 'fake', label: 'الحاجة مش حقيقية أو الصور مش بتاعتها' },
  { id: 'prohibited', label: 'حاجة ممنوع تتباع' },
  { id: 'sold', label: 'اتباعت أو اتبدّلت خلاص' },
  { id: 'other', label: 'حاجة تانية' },
];

export const MARKET_SAFETY_TIPS = [
  'اتقابلوا في مكان عام فيه ناس، زي قدام الجامع أو السنترال.',
  'اتفرّج على الحاجة وجرّبها كويس قبل ما تدفع.',
  'ماتبعتش فلوس مقدم، لا بالمحفظة ولا إنستاباي.',
];

export function categoryLabel(id: ListingCategory): string {
  return LISTING_CATEGORIES.find((c) => c.id === id)?.label ?? '';
}
export function categoryIcon(id: ListingCategory): string {
  return LISTING_CATEGORIES.find((c) => c.id === id)?.icon ?? '📦';
}
export function conditionLabel(id: ListingCondition): string {
  return LISTING_CONDITIONS.find((c) => c.id === id)?.label ?? '';
}

/** 3500 → "3,500 جنيه" (Western digits, thousands comma) */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('en-US')} جنيه`;
}

const DAY = 24 * 60 * 60 * 1000;

export function isLive(l: Pick<MarketListing, 'status' | 'expiresAt'>, now = Date.now()): boolean {
  return l.status === 'active' && new Date(l.expiresAt).getTime() > now;
}

/** Whole days left before the post hides (0 on its last day) */
export function daysLeft(l: Pick<MarketListing, 'expiresAt'>, now = Date.now()): number {
  return Math.max(0, Math.floor((new Date(l.expiresAt).getTime() - now) / DAY));
}

export function canRenew(l: Pick<MarketListing, 'status' | 'expiresAt'>, now = Date.now()): boolean {
  return l.status === 'active' && new Date(l.expiresAt).getTime() - now <= LISTING_RENEW_WINDOW_DAYS * DAY;
}

/** What the owner reads on their own post */
export function ownerStatusLabel(l: Pick<MarketListing, 'status' | 'expiresAt' | 'kind'>, now = Date.now()): string {
  if (l.status === 'hidden') return 'متخبّي لحد ما الإدارة تراجعه';
  if (l.status === 'sold' || l.status === 'swapped') return KIND_INFO[l.kind].done;
  if (!isLive(l, now)) return 'خلصت مدته';
  const d = daysLeft(l, now);
  return d === 0 ? 'آخر يوم ليه' : `منشور • فاضل ${d} يوم`;
}

/** "من ساعتين" style age of a post or message */
export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'دلوقتي';
  if (mins < 60) return mins <= 2 ? 'من دقيقة' : `من ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? 'من ساعة' : hours === 2 ? 'من ساعتين' : `من ${hours} ساعات`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'امبارح';
  if (days === 2) return 'من يومين';
  return days <= 10 ? `من ${days} أيام` : `من ${days} يوم`;
}

// ─── Browse filters
export interface ListingFilters {
  search: string;
  village: string; // '' = every village
  category: ListingCategory | '';
  minPrice: number | null;
  maxPrice: number | null;
}

export const EMPTY_FILTERS: ListingFilters = { search: '', village: '', category: '', minPrice: null, maxPrice: null };

export function filterListings(list: MarketListing[], f: ListingFilters): MarketListing[] {
  return list.filter((l) => {
    if (f.village && l.village !== f.village) return false;
    if (f.category && l.category !== f.category) return false;
    if (l.kind === 'sale' && l.price != null) {
      if (f.minPrice != null && l.price < f.minPrice) return false;
      if (f.maxPrice != null && l.price > f.maxPrice) return false;
    }
    return matchesSearch(f.search, [l.title, l.description, l.wanted, categoryLabel(l.category), l.village]);
  });
}

// ─── The post form
/** Field → Egyptian Arabic message; empty when the draft is fine */
export function validateListingDraft(d: ListingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = d.title.trim();
  if (title.length < 3) errors.title = 'اكتب اسم الحاجة (3 حروف على الأقل)';
  else if (title.length > 80) errors.title = 'الاسم طويل، خليه 80 حرف بالكتير';
  if (!d.category) errors.category = 'اختار القسم';
  if (!d.condition) errors.condition = 'اختار حالتها';
  if (d.village.trim().length < 2) errors.village = 'اختار القرية';
  if (d.description.trim().length > 1000) errors.description = 'الوصف طويل، خليه 1000 حرف بالكتير';
  if (d.kind === 'sale') {
    if (d.price == null || !Number.isInteger(d.price) || d.price < 1) errors.price = 'اكتب السعر بالجنيه';
    else if (d.price > MAX_PRICE) errors.price = 'السعر كبير أوي، راجعه';
  } else {
    const wanted = d.wanted.trim();
    if (wanted.length < 2) errors.wanted = 'اكتب عايز تبدّلها بإيه';
    else if (wanted.length > 200) errors.wanted = 'خليها 200 حرف بالكتير';
  }
  if (d.photos.length > MAX_PHOTOS) errors.photos = `${MAX_PHOTOS} صور بالكتير`;
  if (d.showPhone && !/^01[0125][0-9]{8}$/.test(d.contactPhone)) errors.contactPhone = 'رقم الموبايل غير صحيح (مثال: 01012345678)';
  return errors;
}

/** Digits typed in Arabic or with commas → a whole number of pounds, or null */
export function parsePrice(value: string): number | null {
  const digits = value
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[\s,،٬.]/g, '');
  if (!/^\d{1,9}$/.test(digits)) return null;
  return Number(digits);
}

/** wa.me link to the owner (Egypt +20), with a first line about the post */
export function listingWhatsappLink(phone: string, listing: Pick<MarketListing, 'title' | 'kind'>): string {
  const intl = `20${phone.replace(/^0/, '')}`;
  const text = listing.kind === 'sale'
    ? `السلام عليكم، شفت إعلانك "${listing.title}" على قريتي. لسه موجود؟`
    : `السلام عليكم، شفت إعلان التبادل "${listing.title}" على قريتي. ممكن نتكلم؟`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

/** Words that bring the market banner up in the home search */
export const MARKET_SEARCH_WORDS = ['مستعمل', 'بيع', 'أبيع', 'ابيع', 'اشتري', 'تبادل', 'بدل', 'بدّل', 'تبديل', 'سوق'];
