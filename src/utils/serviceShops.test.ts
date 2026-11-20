import { describe, expect, it } from 'vitest';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';
import { cartItemFromProduct, cartItemFromService, migrateCart } from '@/stores/useCartStore';
import { productsForShop } from '@/data/catalog';
import type { CartItem } from '@/types';
import { SERVICE_SHOP_KINDS, isShopService, isWholeShopLine, sellsProducts, shopsForService } from './serviceShops';

const byName = (name: string) => SERVICES.find((s) => s.name === name)!;

describe('shop-like services', () => {
  it('treats the bread, vegetables, dairy and butcher services as shops', () => {
    for (const name of ['عيش من الفرن', 'خضار وفاكهة', 'لقمة من بهايم', 'جزارة']) {
      expect(isShopService(byName(name)), name).toBe(true);
    }
  });

  it('keeps the courier, craftsmen, teachers and the gas cylinder as services', () => {
    for (const name of ['مرسول', 'سباك', 'مدرس إنجليزي', 'تغيير أنبوبة بوتاجاز', 'كهربائي', 'أكل بيتي']) {
      expect(isShopService(byName(name)), name).toBe(false);
    }
  });

  it('finds village shops with products for every shop-like service', () => {
    for (const id of Object.keys(SERVICE_SHOP_KINDS).map(Number)) {
      const service = SERVICES.find((s) => s.id === id)!;
      const shops = shopsForService(service, SHOPS);
      expect(shops.length, service.name).toBeGreaterThan(0);
      for (const shop of shops) expect(productsForShop(shop)?.length, shop.name).toBeGreaterThan(0);
    }
  });

  it('lists open shops first', () => {
    const service = byName('عيش من الفرن');
    const shops = shopsForService(service, [
      { ...SHOPS[0], id: 900, open: false, kind: 'bakery' },
      { ...SHOPS[0], id: 901, open: true, kind: 'bakery', time: '⏰ 24 ساعة' },
    ]);
    expect(shops.map((s) => s.id)).toEqual([901, 900]);
  });

  it('lists nothing for a real service', () => {
    expect(shopsForService(byName('سباك'), SHOPS)).toEqual([]);
  });
});

describe('sellsProducts', () => {
  it('opens the product list for every shop but salons, workshops and laundries', () => {
    for (const shop of SHOPS) {
      expect(sellsProducts(shop), shop.name).toBe(shop.kind !== 'other');
    }
    expect(sellsProducts({ kind: 'restaurant' })).toBe(true);
    expect(sellsProducts({ kind: undefined })).toBe(false);
  });
});

describe('whole-shop cart lines', () => {
  it('spots a whole bakery service put in the cart by the old button', () => {
    expect(isWholeShopLine(cartItemFromService(byName('عيش من الفرن')))).toBe(true);
  });

  it('leaves products and real services alone', () => {
    const bakery = SHOPS.find((s) => s.kind === 'bakery')!;
    const product = productsForShop(bakery)![0];
    expect(isWholeShopLine(cartItemFromProduct(bakery, product))).toBe(false);
    expect(isWholeShopLine(cartItemFromService(byName('سباك')))).toBe(false);
  });

  it('drops whole shops from carts saved on the phone and keeps the rest', () => {
    const bakery = SHOPS.find((s) => s.kind === 'bakery')!;
    const bread = cartItemFromProduct(bakery, productsForShop(bakery)![0]);
    const plumber = cartItemFromService(byName('سباك'));
    const market = cartItemFromService(byName('عيش من الفرن'));
    expect(migrateCart({ items: [market, bread] }, 2).items).toEqual([bread]);
    expect(migrateCart({ items: [plumber] }, 2).items).toEqual([plumber]);
    expect(migrateCart({ items: [bread] }, 1).items).toEqual([]);
    expect(migrateCart(null, 2).items).toEqual([]);
    expect(migrateCart({ items: 'x' as unknown as CartItem[] }, 2).items).toEqual([]);
  });
});
