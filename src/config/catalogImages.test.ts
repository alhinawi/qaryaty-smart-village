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
      if (image.photo.startsWith('/img/catalog-missing/')) {
        expect(existsSync(`public${image.photo}`), image.photo).toBe(true);
      }
    }
  });
  it('uses a different asset for every catalog entry', () => {
    expect(new Set(Object.values(manifest).map((v) => v.photo)).size).toBe(Object.keys(manifest).length);
  });
});
