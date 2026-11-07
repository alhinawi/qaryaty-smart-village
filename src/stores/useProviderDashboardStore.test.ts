import { setDemoModeFlag } from '@/config/demoMode';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProviderDashboardStore } from './useProviderDashboardStore';

const shopId = 42;

const reset = () => { setDemoModeFlag(true); useProviderDashboardStore.setState({ merchants: {}, professionals: {} }); };

const merchant = () => useProviderDashboardStore.getState().merchants[shopId];

describe('provider dashboard store: product photos and custom products', () => {
  beforeEach(reset);

  it('keeps a replaced shop photo', () => {
    useProviderDashboardStore.getState().setShopPhoto(shopId, 'data:image/jpeg;base64,shop');
    expect(merchant().photo).toBe('data:image/jpeg;base64,shop');
  });

  it('keeps a replaced product photo next to other overrides of the same product', () => {
    const s = useProviderDashboardStore.getState();
    s.setProductAvailable(shopId, 'p1', false);
    s.setProductPhoto(shopId, 'p1', 'data:image/jpeg;base64,p1');
    expect(merchant().products.p1).toEqual({ available: false, photo: 'data:image/jpeg;base64,p1' });
  });

  it('adds a custom product available by default and edits its price, photo and availability', () => {
    const s = useProviderDashboardStore.getState();
    const added = s.addCustomProduct(shopId, { name: 'جبنة قريش', price: 25, unit: 'كيلو', section: 'ألبان وجبن', emoji: '🧀' });
    expect(added.id).toMatch(/^custom-/);
    expect(added.available).toBe(true);
    expect(merchant().customProducts).toHaveLength(1);

    s.setCustomProductPrice(shopId, added.id, 30);
    s.setCustomProductPhoto(shopId, added.id, 'data:image/jpeg;base64,cheese');
    s.setCustomProductAvailable(shopId, added.id, false);
    expect(merchant().customProducts[0]).toMatchObject({ price: 30, photo: 'data:image/jpeg;base64,cheese', available: false });
  });

  it('removes only the requested custom product', () => {
    const s = useProviderDashboardStore.getState();
    const a = s.addCustomProduct(shopId, { name: 'أ', price: 1, unit: 'قطعة', section: '', emoji: '📦' });
    const b = s.addCustomProduct(shopId, { name: 'ب', price: 2, unit: 'قطعة', section: '', emoji: '📦' });
    s.removeCustomProduct(shopId, a.id);
    expect(merchant().customProducts.map((c) => c.id)).toEqual([b.id]);
  });

  it('keeps edits of different shops apart', () => {
    const s = useProviderDashboardStore.getState();
    s.setShopPhoto(shopId, 'data:image/jpeg;base64,a');
    s.setShopPhoto(7, 'data:image/jpeg;base64,b');
    expect(useProviderDashboardStore.getState().merchants[shopId].photo).toBe('data:image/jpeg;base64,a');
    expect(useProviderDashboardStore.getState().merchants[7].photo).toBe('data:image/jpeg;base64,b');
  });
});
