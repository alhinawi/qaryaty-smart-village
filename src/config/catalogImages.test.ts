import { describe, expect, it } from 'vitest';
import { catalogProductPhoto } from './catalogImages';
import manifest from './catalogImageManifest.json';
import type { Product } from '@/types';
describe('original catalog photos', () => {
  const key = Object.keys(manifest)[0] as keyof typeof manifest;
  const [kind, id, productId] = key.split(/[:|]/);
  const scope = `${kind}:${id}`;
  const base: Product = { id: productId, name: manifest[key].name, emoji: '🍽️', price: 12, unit: 'قطعة', step: 1, photo: manifest[key].originalPhoto };
  it('only changes photo for the known scoped item', () => {
    expect(catalogProductPhoto(scope, base)).toEqual({ ...base, photo: manifest[key].photo });
    expect(catalogProductPhoto('restaurant:9999', base)).toEqual(base);
    expect(catalogProductPhoto(scope, { ...base, name: 'منتج آخر' }).photo).toBe(base.photo);
  });
  it('preserves real merchant uploads', () => {
    expect(catalogProductPhoto(scope, { ...base, photo: 'https://merchant.example/upload.webp' }).photo).toBe('https://merchant.example/upload.webp');
  });
  it('uses a different asset for every catalog entry', () => {
    expect(new Set(Object.values(manifest).map((v) => v.photo)).size).toBe(Object.keys(manifest).length);
  });
});
