import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCatalogRepo } from './mockCatalogRepo';
import { useProviderDashboardStore } from '@/stores/useProviderDashboardStore';
import type { Shop } from '@/types';

const shop = { id: 1, kind: 'grocery' } as Pick<Shop, 'id' | 'kind'>;

const add = (input: { name: string; photo?: string; available?: boolean }) => {
  const s = useProviderDashboardStore.getState();
  const p = s.addCustomProduct(1, { name: input.name, price: 10, unit: 'قطعة', section: '', emoji: '📦', ...(input.photo ? { photo: input.photo } : {}) });
  if (input.available === false) s.setCustomProductAvailable(1, p.id, false);
  return p;
};

describe('mock catalog: a custom product shows to customers only when available with a photo', () => {
  beforeEach(() => useProviderDashboardStore.setState({ merchants: {}, professionals: {} }));

  it('hides a saved product that has no photo yet', async () => {
    add({ name: 'منتج من غير صورة' });
    const products = await createMockCatalogRepo().getProducts(shop);
    expect(products?.some((p) => p.name === 'منتج من غير صورة')).toBe(false);
  });

  it('shows a product the moment it has a photo', async () => {
    const p = add({ name: 'منتج بصورة' });
    let products = await createMockCatalogRepo().getProducts(shop);
    expect(products?.some((x) => x.id === p.id)).toBe(false);
    useProviderDashboardStore.getState().setCustomProductPhoto(1, p.id, 'data:image/jpeg;base64,x');
    products = await createMockCatalogRepo().getProducts(shop);
    expect(products?.some((x) => x.id === p.id)).toBe(true);
  });

  it('hides an unavailable product even with a photo', async () => {
    const p = add({ name: 'منتج مقفول', photo: 'data:image/jpeg;base64,x', available: false });
    const products = await createMockCatalogRepo().getProducts(shop);
    expect(products?.some((x) => x.id === p.id)).toBe(false);
  });
});
