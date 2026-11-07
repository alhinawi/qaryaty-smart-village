import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '@/data/categories';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';
import { PROVIDERS } from '@/data/providers';
import { normalizeArabic } from './arabicSearch';
import { rememberSearch, MAX_RECENT_SEARCHES } from './recentSearches';
import { isSeededHistory } from '@/stores/useUIStore';
import type { Shop } from '@/types';
import {
  ALL_TAB,
  buildSearchIndex,
  buildSearchTabs,
  exploreTiles,
  groupProductsByShop,
  groupResults,
  highlightParts,
  normalizeChar,
  searchEntries,
  shopKindLabel,
  shopTab,
  smallPhoto,
  type SearchEntry,
} from './searchScreen';

const catalog = { shops: SHOPS, services: SERVICES, providers: PROVIDERS, categories: CATEGORIES };
const index = buildSearchIndex(catalog);

describe('search index and tabs', () => {
  it('has every shop, and only active people', () => {
    expect(index.filter((e) => e.type === 'shop')).toHaveLength(SHOPS.length);
    const people = index.filter((e) => e.type === 'person');
    expect(people.length).toBe(PROVIDERS.filter((p) => p.active).length);
  });

  it('starts with الكل and has the restaurants, supermarket, pharmacies and teachers', () => {
    const tabs = buildSearchTabs(index, CATEGORIES);
    expect(tabs[0].id).toBe(ALL_TAB);
    const ids = tabs.map((t) => t.id);
    for (const id of ['restaurants', 'grocery', 'pharmacy', 'shops', 'cat:edu']) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('picks up a new category and a new shop kind without code changes', () => {
    const goldShop = { ...SHOPS[0], id: 9991, kind: 'gold', name: 'مجوهرات النور', description: 'ذهب وفضة', emoji: '💍' } as unknown as Shop;
    const newKindShop = { ...SHOPS[0], id: 9992, kind: 'florist', name: 'ورد الربيع', description: 'ورد طبيعي وبوكيهات', emoji: '🌸' } as unknown as Shop;
    const service = { ...SERVICES[0], id: 'x-new', cat: 'pets', name: 'دكتور بيطري' } as unknown as (typeof SERVICES)[number];
    const categories = [...CATEGORIES, { id: 'pets', label: 'حيوانات', emoji: '🐾' }] as typeof CATEGORIES;
    const shops = [...SHOPS, goldShop, newKindShop];
    const idx = buildSearchIndex({ shops, services: [...SERVICES, service], providers: PROVIDERS, categories });
    expect(buildSearchTabs(idx, categories).map((t) => t.label)).toContain('حيوانات');
    expect(searchEntries(idx, 'مجوهرات', 'shops').map((e) => e.title)).toContain('مجوهرات النور');
    const kinds = exploreTiles('shops', shops, idx).map((t) => t.label);
    expect(kinds).toContain('ذهب');
    expect(kinds).toContain('ورد طبيعي');
    expect(shopKindLabel('florist', shops).emoji).toBe('🌸');
  });

  it('puts each shop on one shop tab', () => {
    expect(shopTab({ kind: 'restaurant' })).toBe('restaurants');
    expect(shopTab({ kind: 'grocery' })).toBe('grocery');
    expect(shopTab({ kind: 'pharmacy' })).toBe('pharmacy');
    expect(shopTab({ kind: 'bakery' })).toBe('shops');
    expect(shopTab({})).toBe('shops');
  });
});

describe('searchEntries', () => {
  it('finds nothing for an empty query', () => {
    expect(searchEntries(index, '   ')).toEqual([]);
  });

  it('finds bread shops and bread products, in any spelling', () => {
    const results = searchEntries(index, 'عيش');
    expect(results.some((e) => e.type === 'shop' && e.shop.kind === 'bakery')).toBe(true);
    expect(results.some((e) => e.type === 'product')).toBe(true);
    expect(searchEntries(index, 'عيــش').length).toBe(results.length);
  });

  it('finds teachers by subject on the teachers tab only', () => {
    const teachers = searchEntries(index, 'إنجليزي', 'cat:edu');
    expect(teachers.length).toBeGreaterThan(0);
    expect(teachers.every((e) => e.tabs.includes('cat:edu'))).toBe(true);
    expect(searchEntries(index, 'إنجليزي', 'restaurants').filter((e) => e.type === 'person')).toHaveLength(0);
  });

  it('ranks names that start with the query first', () => {
    const results = searchEntries(index, 'سباك');
    expect(results.length).toBeGreaterThan(0);
    const firstNonPrefix = results.findIndex((e) => !e.normTitle.startsWith(normalizeArabic('سباك')));
    const lastPrefix = results.map((e) => e.normTitle.startsWith(normalizeArabic('سباك'))).lastIndexOf(true);
    if (firstNonPrefix !== -1 && lastPrefix !== -1) expect(lastPrefix).toBeLessThan(firstNonPrefix);
  });

  it('groups products before places, services and people', () => {
    const groups = groupResults(searchEntries(index, 'سمك'));
    const order = groups.map((g) => g.id);
    expect(order.length).toBeGreaterThan(1);
    expect(order[0]).toBe('products');
    expect(order).toContain('restaurants');
    expect(order).toContain('shops');
    const all = ['products', 'restaurants', 'shops', 'services', 'edu', 'health', 'people', 'workers'];
    expect([...order].sort((a, b) => all.indexOf(a) - all.indexOf(b))).toEqual(order);
    expect(groups.every((g) => g.entries.length > 0)).toBe(true);
  });

  it('finds restaurants by the food tiles they show', () => {
    for (const tile of exploreTiles('restaurants', SHOPS, index)) {
      expect(searchEntries(index, tile.term, 'restaurants').length, tile.label).toBeGreaterThan(0);
    }
  });

  it('every tile on every tab finds something there', () => {
    for (const tab of buildSearchTabs(index, CATEGORIES)) {
      for (const tile of exploreTiles(tab.id, SHOPS, index)) {
        expect(searchEntries(index, tile.term, tab.id).length, `${tab.label}: ${tile.label}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('highlightParts', () => {
  it('marks the matching words, ignoring hamza and taa marbuta', () => {
    const parts = highlightParts('مدرس لغة إنجليزية', 'انجليزيه');
    expect(parts).toEqual([
      { text: 'مدرس لغة ', match: false },
      { text: 'إنجليزية', match: true },
    ]);
  });

  it('keeps tashkeel inside a match and the text unchanged', () => {
    const text = 'عيْش بلدي طازج';
    const parts = highlightParts(text, 'عيش طازج');
    expect(parts.map((p) => p.text).join('')).toBe(text);
    expect(parts.filter((p) => p.match).map((p) => p.text)).toEqual(['عيْش', 'طازج']);
  });

  it('returns the text as one plain part when nothing matches', () => {
    expect(highlightParts('سباك', 'نجار')).toEqual([{ text: 'سباك', match: false }]);
    expect(highlightParts('سباك', '')).toEqual([{ text: 'سباك', match: false }]);
  });

  it('normalizes one character the way normalizeArabic does', () => {
    const text = 'أَكْل بيتى هايلة Baby';
    expect([...text].map(normalizeChar).join('')).toBe(normalizeArabic(text));
  });
});

describe('photos', () => {
  it('food tiles use different photos where the restaurants allow it', () => {
    const tiles = exploreTiles('restaurants', SHOPS, index);
    const photos = tiles.map((t) => t.photo).filter(Boolean);
    expect(photos.length).toBeGreaterThan(0);
    // Repeats only where a type's restaurants are all shown already
    expect(new Set(photos).size).toBeGreaterThanOrEqual(Math.ceil(photos.length * 0.8));
  });

  it('asks Pexels for a small tile photo and leaves other links alone', () => {
    expect(smallPhoto('https://images.pexels.com/photos/1/a.jpeg?auto=compress&cs=tinysrgb&w=330')).toBe(
      'https://images.pexels.com/photos/1/a.jpeg?auto=compress&cs=tinysrgb&w=160'
    );
    expect(smallPhoto('https://upload.wikimedia.org/x/330px-a.jpg')).toBe('https://upload.wikimedia.org/x/330px-a.jpg');
    expect(smallPhoto(undefined)).toBeUndefined();
  });

  it('kind tiles show a real shop photo, falling back to emoji only with none', () => {
    const tiles = exploreTiles('shops', SHOPS, index);
    const withPhoto = tiles.filter((t) => t.photo);
    expect(withPhoto.length).toBeGreaterThan(0);
    // attar, coffee, dairy and stationery demo shops all carry photos
    const labels = ['عطارة', 'بن وقهوة', 'ألبان', 'مكتبات'];
    for (const label of labels) {
      const tile = tiles.find((t) => t.label === label);
      if (tile) expect(tile.photo, label).toBeTruthy();
    }
    // A kind whose shops have no photo keeps its emoji and no broken image
    const photoless = { ...SHOPS[0], id: 9993, kind: 'florist', name: 'ورد الربيع', description: 'ورد طبيعي', emoji: '🌸', photo: undefined } as unknown as Shop;
    const floristTile = exploreTiles('shops', [...SHOPS, photoless], buildSearchIndex({ shops: [...SHOPS, photoless], services: SERVICES, providers: PROVIDERS, categories: CATEGORIES })).find((t) => t.key === 'kind-florist');
    expect(floristTile?.photo).toBeUndefined();
    expect(floristTile?.emoji).toBeTruthy();
    for (const tile of tiles) expect(tile.emoji).toBeTruthy();
  });

  it('kind tiles prefer photos no other tile shows yet', () => {
    const photos = exploreTiles('shops', SHOPS, index).map((t) => t.photo).filter(Boolean);
    expect(new Set(photos).size).toBe(photos.length);
  });

  it('category service tiles show the service image', () => {
    const tabs = buildSearchTabs(index, CATEGORIES).filter((t) => t.id.startsWith('cat:'));
    expect(tabs.length).toBeGreaterThan(0);
    for (const tab of tabs) {
      const serviceTiles = exploreTiles(tab.id, SHOPS, index).filter((t) => t.key.startsWith('tile-'));
      for (const tile of serviceTiles) expect(tile.photo ?? tile.emoji, `${tab.label}: ${tile.label}`).toBeTruthy();
    }
    const eduTiles = exploreTiles('cat:edu', SHOPS, index);
    expect(eduTiles.some((t) => t.photo)).toBe(true);
  });
});

describe('recent searches', () => {
  it('puts the newest first, without repeats or blanks, up to the limit', () => {
    let history: string[] = [];
    history = rememberSearch(history, ' عيش ');
    history = rememberSearch(history, 'سباك');
    history = rememberSearch(history, 'عيـش');
    history = rememberSearch(history, '   ');
    expect(history).toEqual(['عيـش', 'سباك']);
    for (let i = 0; i < 20; i++) history = rememberSearch(history, `بحث ${i}`);
    expect(history).toHaveLength(MAX_RECENT_SEARCHES);
  });

  it('recognizes the old made-up history only', () => {
    expect(isSeededHistory(['عيش', 'شوي سمك', 'سباك', 'سوبر ماركت'])).toBe(true);
    expect(isSeededHistory(['عيش'])).toBe(false);
    expect(isSeededHistory(undefined)).toBe(false);
  });
});

describe('products grouped by shop', () => {
  it('groups matching products under their shop, one section per shop, in first-appearance order', () => {
    const results = searchEntries(index, 'عيش');
    const products = results.filter((e): e is Extract<SearchEntry, { type: 'product' }> => e.type === 'product');
    expect(products.length).toBeGreaterThan(0);
    const groups = groupProductsByShop(results);
    expect(groups.map((g) => g.shop.id)).toEqual([...new Set(products.map((e) => e.shop.id))]);
    const groupedKeys = groups.flatMap((g) => g.entries).map((e) => e.key).sort();
    expect(groupedKeys).toEqual(products.map((e) => e.key).sort());
    for (const g of groups) {
      expect(g.entries.every((e) => e.type === 'product' && e.shop.id === g.shop.id)).toBe(true);
    }
  });

  it('leaves out shops, services and people', () => {
    const results = searchEntries(index, 'عيش');
    expect(groupProductsByShop(results.filter((e) => e.type !== 'product'))).toEqual([]);
  });
});
