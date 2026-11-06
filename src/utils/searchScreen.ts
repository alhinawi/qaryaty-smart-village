// ─── The search screen (Talabat-style): tabs, explore tiles and grouped live results
// Everything here is built from the catalog that is loaded (shops, their products, services,
// people) and the category list, so a new shop kind or category shows up without code changes.
import type {
  CategoryItem,
  Product,
  Provider,
  ProviderKind,
  Service,
  ServiceCategory,
  Shop,
} from '@/types';
import { FOOD_TYPE_LABELS, productsForShop, sectionsOf } from '@/data/catalog';
import { SUBJECT_LABELS } from '@/data/teachers';
import { providerRoleLabel } from '@/utils/people';
import { gridServices } from '@/utils/peopleSections';
import { normalizeArabic } from '@/utils/arabicSearch';

// ─── Shop kinds
export interface KindLabel {
  label: string;
  emoji: string;
}

/** How each shop kind is named on tabs and tiles. Kinds missing here get a name from their shops. */
export const SHOP_KIND_LABELS: Record<string, KindLabel> = {
  grocery: { label: 'سوبر ماركت', emoji: '🛒' },
  bakery: { label: 'عيش وفينو', emoji: '🥖' },
  veg: { label: 'خضار', emoji: '🥬' },
  fruit: { label: 'فاكهة', emoji: '🍎' },
  fish: { label: 'سمك', emoji: '🐟' },
  pharmacy: { label: 'صيدليات', emoji: '💊' },
  butcher: { label: 'لحمة', emoji: '🥩' },
  poultry: { label: 'فراخ', emoji: '🐔' },
  sweets: { label: 'حلويات', emoji: '🍰' },
  attar: { label: 'عطارة', emoji: '🌿' },
  coffee: { label: 'بن وقهوة', emoji: '☕' },
  dairy: { label: 'ألبان', emoji: '🥛' },
  stationery: { label: 'مكتبات', emoji: '📚' },
  housewares: { label: 'أدوات منزلية', emoji: '🍳' },
  gold: { label: 'ذهب', emoji: '💍' },
  jewelry: { label: 'ذهب', emoji: '💍' },
  restaurant: { label: 'مطاعم', emoji: '🍽️' },
  other: { label: 'محلات تانية', emoji: '🏪' },
};

/** A kind's name and emoji; an unknown kind is named after its first shop's description. */
export function shopKindLabel(kind: string, shops: Shop[] = []): KindLabel {
  const known = SHOP_KIND_LABELS[kind];
  if (known) return known;
  const first = shops.find((shop) => (shop.kind ?? 'other') === kind);
  if (!first) return SHOP_KIND_LABELS.other;
  const words = first.description.split(/[\s،,]+/).filter(Boolean).slice(0, 2).join(' ');
  return { label: words || first.name, emoji: first.emoji };
}

// ─── Tabs
export type SearchTabId = string;

export interface SearchTab {
  id: SearchTabId;
  label: string;
  emoji: string;
}

export const ALL_TAB = 'all';
const SHOP_TAB_ORDER: SearchTab[] = [
  { id: 'restaurants', label: 'المطاعم', emoji: '🍽️' },
  { id: 'grocery', label: 'سوبر ماركت', emoji: '🛒' },
  { id: 'pharmacy', label: 'صيدليات', emoji: '💊' },
  { id: 'shops', label: 'المحلات', emoji: '🏪' },
];

/** The tab a shop belongs to: restaurants, the supermarket, pharmacies, or every other shop. */
export function shopTab(shop: Pick<Shop, 'kind'>): SearchTabId {
  if (shop.kind === 'restaurant') return 'restaurants';
  if (shop.kind === 'grocery') return 'grocery';
  if (shop.kind === 'pharmacy') return 'pharmacy';
  return 'shops';
}

export const categoryTab = (cat: ServiceCategory | string): SearchTabId => `cat:${cat}`;

// ─── Index
export type ResultGroupId =
  | 'restaurants'
  | 'shops'
  | 'products'
  | 'services'
  | 'edu'
  | 'health'
  | 'people'
  | 'workers';

export const RESULT_GROUPS: { id: ResultGroupId; title: string; emoji: string }[] = [
  { id: 'restaurants', title: 'المطاعم', emoji: '🍽️' },
  { id: 'shops', title: 'المحلات', emoji: '🏪' },
  { id: 'products', title: 'المنتجات والأكلات', emoji: '🛍️' },
  { id: 'services', title: 'الخدمات', emoji: '⚡' },
  { id: 'edu', title: 'المدرسين', emoji: '👩‍🏫' },
  { id: 'health', title: 'الدكاترة والتمريض', emoji: '🩺' },
  { id: 'people', title: 'رعاية أطفال وكبار السن ونظافة', emoji: '🧹' },
  { id: 'workers', title: 'الصنايعية والخدمات', emoji: '🔧' },
];

const PERSON_GROUP: Record<ProviderKind, ResultGroupId> = {
  teacher: 'edu',
  doctor: 'health',
  nurse: 'health',
  babysitter: 'people',
  cleaner: 'people',
  worker: 'workers',
};

interface EntryBase {
  key: string;
  group: ResultGroupId;
  title: string;
  subtitle: string;
  /** Tabs this entry shows on (always includes 'all'). */
  tabs: SearchTabId[];
  /** Normalized text the query is matched against. */
  haystack: string;
  /** Normalized title, to rank names that start with the query first. */
  normTitle: string;
}

export type SearchEntry =
  | (EntryBase & { type: 'shop'; shop: Shop })
  | (EntryBase & { type: 'product'; shop: Shop; product: Product })
  | (EntryBase & { type: 'service'; service: Service })
  | (EntryBase & { type: 'person'; provider: Provider; service: Service });

export interface SearchCatalog {
  shops: Shop[];
  services: Service[];
  providers: Provider[];
  categories: CategoryItem[];
}

const hay = (fields: Array<string | undefined | null>) =>
  normalizeArabic(fields.filter(Boolean).join(' '));

function categoryLabel(cat: string, categories: CategoryItem[]): string {
  return categories.find((c) => c.id === cat)?.label ?? '';
}

/** Every shop, product, service and person the search can find. */
export function buildSearchIndex({ shops, services, providers, categories }: SearchCatalog): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const shop of shops) {
    const tab = shopTab(shop);
    const kind = shopKindLabel(shop.kind ?? 'other', shops).label;
    const foodLabels = (shop.foodTypes ?? []).map((t) => FOOD_TYPE_LABELS[t]?.label);
    const products = productsForShop(shop) ?? [];
    entries.push({
      type: 'shop',
      key: `shop-${shop.id}`,
      group: shop.kind === 'restaurant' ? 'restaurants' : 'shops',
      title: shop.name,
      subtitle: shop.description,
      tabs: [ALL_TAB, tab],
      haystack: hay([shop.name, shop.description, kind, ...foodLabels, ...products.map((p) => p.name)]),
      normTitle: normalizeArabic(shop.name),
      shop,
    });
    for (const product of products) {
      entries.push({
        type: 'product',
        key: `product-${shop.id}-${product.id}`,
        group: 'products',
        title: product.name,
        subtitle: shop.name,
        tabs: [ALL_TAB, tab],
        haystack: hay([product.name, product.section, shop.kind === 'restaurant' ? '' : kind]),
        normTitle: normalizeArabic(product.name),
        shop,
        product,
      });
    }
  }

  for (const service of gridServices(services, providers)) {
    if (service.hidden) continue;
    entries.push({
      type: 'service',
      key: `service-${service.id}`,
      group: 'services',
      title: service.name,
      subtitle: service.desc,
      tabs: [ALL_TAB, categoryTab(service.cat)],
      haystack: hay([service.name, service.desc, categoryLabel(service.cat, categories), ...(service.keywords ?? [])]),
      normTitle: normalizeArabic(service.name),
      service,
    });
  }

  const byId = new Map(services.map((s) => [s.id, s]));
  for (const provider of providers) {
    const service = byId.get(provider.serviceId);
    // Hidden or missing service: they could not be booked
    if (!provider.active || !service) continue;
    const role = providerRoleLabel(provider);
    entries.push({
      type: 'person',
      key: `person-${provider.id}`,
      group: PERSON_GROUP[provider.kind] ?? 'workers',
      title: provider.name,
      subtitle: role,
      tabs: [ALL_TAB, categoryTab(service.cat)],
      haystack: hay([
        provider.name,
        role,
        provider.subject ? SUBJECT_LABELS[provider.subject] : '',
        provider.specialty,
        provider.area,
        provider.village,
        service.name,
        provider.bio,
      ]),
      normTitle: normalizeArabic(provider.name),
      provider,
      service,
    });
  }

  return entries;
}

/** "الكل", then the shop tabs and the categories that have something in them, in the app's order. */
export function buildSearchTabs(entries: SearchEntry[], categories: CategoryItem[]): SearchTab[] {
  const used = new Set(entries.flatMap((e) => e.tabs));
  const tabs: SearchTab[] = [{ id: ALL_TAB, label: 'الكل', emoji: '🔎' }];
  for (const tab of SHOP_TAB_ORDER) if (used.has(tab.id)) tabs.push(tab);
  const seen = new Set<string>();
  for (const category of categories) {
    if (category.id === 'all' || category.id === 'restaurants') continue;
    const id = categoryTab(category.id);
    seen.add(id);
    if (used.has(id)) tabs.push({ id, label: category.label, emoji: category.emoji });
  }
  // A category with services that the list does not name yet still gets a tab
  for (const entry of entries) {
    if (entry.type !== 'service') continue;
    const id = categoryTab(entry.service.cat);
    if (seen.has(id)) continue;
    seen.add(id);
    tabs.push({ id, label: entry.service.cat, emoji: entry.service.emoji });
  }
  return tabs;
}

// ─── Results
export interface ResultGroup {
  id: ResultGroupId;
  title: string;
  emoji: string;
  entries: SearchEntry[];
}

export function queryTokens(query: string): string[] {
  return normalizeArabic(query).split(' ').filter(Boolean);
}

/** Entries on the tab that contain every word of the query; names that start with it come first. */
export function searchEntries(entries: SearchEntry[], query: string, tab: SearchTabId = ALL_TAB): SearchEntry[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return [];
  const whole = tokens.join(' ');
  const rank = (e: SearchEntry) => (e.normTitle.startsWith(whole) ? 0 : e.normTitle.includes(whole) ? 1 : 2);
  return entries
    .filter((e) => e.tabs.includes(tab) && tokens.every((t) => e.haystack.includes(t)))
    .map((entry, index) => ({ entry, index, rank: rank(entry) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((r) => r.entry);
}

/** Results in the screen's order: places, products, services, then people. Empty groups are left out. */
export function groupResults(results: SearchEntry[]): ResultGroup[] {
  return RESULT_GROUPS.map((g) => ({ ...g, entries: results.filter((r) => r.group === g.id) })).filter(
    (g) => g.entries.length > 0
  );
}

// ─── Explore tiles ("عايز إيه النهارده؟")
export interface ExploreTile {
  key: string;
  label: string;
  emoji: string;
  photo?: string;
  /** What tapping the tile searches for. */
  term: string;
}

/** Pexels photos at tile size (their CDN serves WebP when the browser takes it). */
export function smallPhoto(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.includes('images.pexels.com')) return url.replace(/([?&])w=\d+/, '$1w=160');
  return url;
}

function foodTiles(shops: Shop[]): ExploreTile[] {
  const restaurants = shops.filter((s) => s.kind === 'restaurant');
  const tiles: ExploreTile[] = [];
  const used = new Set<string>();
  const seen = new Set<string>();
  for (const shop of restaurants) {
    for (const type of shop.foodTypes ?? []) {
      const label = FOOD_TYPE_LABELS[type];
      if (!label || seen.has(type)) continue;
      seen.add(type);
      // A photo from a restaurant of this type, preferring one no other tile shows yet
      const withType = restaurants.filter((r) => r.photo && r.foodTypes?.includes(type));
      const pick = withType.find((r) => !used.has(r.photo as string)) ?? withType[0];
      if (pick?.photo) used.add(pick.photo);
      tiles.push({ key: `food-${type}`, label: label.label, emoji: label.emoji, photo: smallPhoto(pick?.photo), term: label.label });
    }
  }
  return tiles;
}

function kindTiles(shops: Shop[]): ExploreTile[] {
  const kinds = [...new Set(shops.filter((s) => s.kind !== 'restaurant').map((s) => s.kind ?? 'other'))];
  return kinds
    .filter((kind) => kind !== 'other')
    .map((kind) => {
      const { label, emoji } = shopKindLabel(kind, shops);
      return { key: `kind-${kind}`, label, emoji, term: label };
    });
}

function sectionTiles(shops: Shop[]): ExploreTile[] {
  const sections = new Map<string, ExploreTile>();
  for (const shop of shops) {
    const products = productsForShop(shop) ?? [];
    for (const section of sectionsOf(products)) {
      if (!section || sections.has(section)) continue;
      const first = products.find((p) => p.section === section);
      sections.set(section, { key: `section-${section}`, label: section, emoji: first?.emoji ?? shop.emoji, term: section });
    }
  }
  return [...sections.values()];
}

/** The circles under the tabs: food on الكل and المطاعم, sections in the supermarket and the
 *  pharmacy, shop kinds on المحلات, and a category's services on its own tab. */
export function exploreTiles(tab: SearchTabId, shops: Shop[], index: SearchEntry[]): ExploreTile[] {
  if (tab === ALL_TAB) return [...foodTiles(shops).slice(0, 8), ...kindTiles(shops)];
  if (tab === 'restaurants') return foodTiles(shops);
  if (tab === 'grocery' || tab === 'pharmacy') return sectionTiles(shops.filter((s) => shopTab(s) === tab));
  if (tab === 'shops') return kindTiles(shops.filter((s) => shopTab(s) === 'shops'));
  // A category: its people's subjects (teachers), then its services, from what the index can find
  const seen = new Set<string>();
  const tiles: ExploreTile[] = [];
  const add = (label: string, emoji: string) => {
    if (!label || seen.has(normalizeArabic(label))) return;
    seen.add(normalizeArabic(label));
    tiles.push({ key: `tile-${label}`, label, emoji, term: label });
  };
  for (const entry of index) {
    if (entry.type === 'person' && entry.tabs.includes(tab) && entry.provider.subject) {
      add(SUBJECT_LABELS[entry.provider.subject], entry.service.emoji);
    }
  }
  for (const entry of index) {
    if (entry.type === 'service' && entry.tabs.includes(tab)) add(entry.service.name, entry.service.emoji);
  }
  return tiles;
}

// ─── Highlighting
const TASHKEEL_CHAR = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/;

/** One character as normalizeArabic sees it ('' for tashkeel and tatweel). */
export function normalizeChar(char: string): string {
  if (TASHKEEL_CHAR.test(char)) return '';
  if (/\s/.test(char)) return ' ';
  return normalizeArabic(char) || char.toLowerCase();
}

export interface TextPart {
  text: string;
  match: boolean;
}

/** Splits text into matching and plain parts, ignoring tashkeel, hamza forms, ة/ه and ى/ي. */
export function highlightParts(text: string, query: string): TextPart[] {
  const tokens = queryTokens(query);
  if (!text || tokens.length === 0) return text ? [{ text, match: false }] : [];
  let norm = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const n = normalizeChar(text[i]);
    for (const c of n) {
      norm += c;
      map.push(i);
    }
  }
  const marked = new Array<boolean>(text.length).fill(false);
  for (const token of tokens) {
    let from = 0;
    for (;;) {
      const at = norm.indexOf(token, from);
      if (at === -1) break;
      const start = map[at];
      const end = map[at + token.length - 1];
      for (let i = start; i <= end; i++) marked[i] = true;
      from = at + token.length;
    }
  }
  const parts: TextPart[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.match === marked[i]) last.text += text[i];
    else parts.push({ text: text[i], match: marked[i] });
  }
  return parts;
}
