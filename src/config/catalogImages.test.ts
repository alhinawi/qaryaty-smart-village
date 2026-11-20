import { describe, expect, it } from 'vitest';
import { catalogProductPhoto } from './catalogImages';
import manifest from './catalogImageManifest.json';
import type { Product } from '@/types';
import { SHOPS } from '@/data/shops';
import { productsForShop } from '@/data/catalog';
import { existsSync } from 'node:fs';
describe('original catalog photos', () => {
  const key = Object.keys(manifest)[0] as keyof typeof manifest;
  const [kind, id, productId] = key.split(/[:|]/);
  const scope = `${kind}:${id}`;
  const entry = manifest[key];
  const originalPhoto = 'originalPhoto' in entry && typeof entry.originalPhoto === 'string' ? entry.originalPhoto : undefined;
  const base: Product = { id: productId, name: manifest[key].name, emoji: '🍽️', price: 12, unit: 'قطعة', step: 1, photo: originalPhoto };
  it('only changes photo for the known scoped item', () => {
    expect(catalogProductPhoto(scope, base)).toEqual({ ...base, photo: manifest[key].photo });
    expect(catalogProductPhoto('restaurant:9999', base)).toEqual(base);
    expect(catalogProductPhoto(scope, { ...base, name: 'منتج آخر' }).photo).toBe(base.photo);
  });
  it('preserves real merchant uploads', () => {
    expect(catalogProductPhoto(scope, { ...base, photo: 'https://merchant.example/upload.webp' }).photo).toBe('https://merchant.example/upload.webp');
  });
  it('covers every bundled product and the added local assets exist', () => {
    const products = SHOPS.flatMap(shop => productsForShop(shop) ?? []);
    expect(products.filter(product => !product.photo).map(product => product.name)).toEqual([]);
    for (const image of Object.values(manifest)) {
      if (image.photo.startsWith('/img/catalog-missing/') || image.photo.startsWith('/img/catalog-db/')) {
        expect(existsSync(`public${image.photo}`), image.photo).toBe(true);
      }
    }
  });
  it('serves the shop items that the live catalog hot-linked from our own files', () => {
    const db = Object.entries(manifest).filter(([, v]) => v.photo.startsWith('/img/catalog-db/'));
    expect(db.length).toBeGreaterThan(300);
    for (const [key, image] of db) {
      const [scope, id] = key.split('|');
      const remote: Product = { id, name: image.name, emoji: '🛍️', price: 1, unit: 'قطعة', step: 1,
        photo: 'originalPhoto' in image ? (image.originalPhoto as string) : undefined };
      expect(catalogProductPhoto(scope, remote).photo, key).toBe(image.photo);
      expect(scope.startsWith('dairy'), 'dairy belongs to the gold/dairy work').toBe(false);
    }
  });
  it('uses a different asset for every catalog entry', () => {
    expect(new Set(Object.values(manifest).map((v) => v.photo)).size).toBe(Object.keys(manifest).length);
  });
});
