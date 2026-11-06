import { describe, expect, it } from 'vitest';
import { addressForOrder, formatAddress, googleMapsUrl } from './address';
import { addressDraftSchema } from './validators';
import { createLocalAddressRepo } from '@/repositories/addresses/localAddressRepo';
import { createNominatimGeocoder } from '@/services/maps/geocoder';
import { villageCenter } from '@/services/maps/config';
import type { AddressDraft } from '@/types';

const draft: AddressDraft = {
  lat: 30.99934,
  lng: 31.37397,
  label: 'البيت',
  street: 'شارع الجامع',
  building: '12',
  floor: '2',
  landmark: 'جنب المدرسة',
  phone: '01012345678',
};

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe('formatAddress', () => {
  it('joins the parts in Arabic', () => {
    expect(formatAddress(draft)).toBe('شارع الجامع، بيت 12، الدور 2، جنب المدرسة');
  });
  it('skips empty parts and names a plain landmark', () => {
    expect(formatAddress({ street: '', building: 'بيت الحاج علي', floor: '', landmark: 'المسجد الكبير' })).toBe(
      'بيت الحاج علي، علامة مميزة: المسجد الكبير'
    );
  });
  it('fits the order column', () => {
    expect(addressForOrder({ ...draft, landmark: 'أ'.repeat(400) }).length).toBeLessThanOrEqual(300);
  });
});

describe('googleMapsUrl', () => {
  it('builds a search link', () => {
    expect(googleMapsUrl({ lat: 31, lng: 31.5 })).toBe('https://www.google.com/maps/search/?api=1&query=31.000000,31.500000');
  });
});

describe('addressDraftSchema', () => {
  it('accepts a full address and an empty phone', () => {
    expect(addressDraftSchema.safeParse(draft).success).toBe(true);
    expect(addressDraftSchema.safeParse({ ...draft, phone: '' }).success).toBe(true);
  });
  it('needs something to find the house by', () => {
    const r = addressDraftSchema.safeParse({ ...draft, street: '', building: '', landmark: '' });
    expect(r.success).toBe(false);
  });
  it('rejects a bad phone', () => {
    expect(addressDraftSchema.safeParse({ ...draft, phone: '123' }).success).toBe(false);
  });
});

describe('local address repo', () => {
  it('makes the first address the default and moves the default on delete', async () => {
    const repo = createLocalAddressRepo(memoryStorage());
    const home = await repo.add(draft);
    expect(home.isDefault).toBe(true);
    const work = await repo.add({ ...draft, label: 'الشغل' });
    expect(work.isDefault).toBe(false);
    await repo.setDefault(work.id);
    let list = await repo.list();
    expect(list[0].id).toBe(work.id);
    expect(list.filter((a) => a.isDefault)).toHaveLength(1);
    await repo.remove(work.id);
    list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0].isDefault).toBe(true);
    const edited = await repo.update(home.id, { ...draft, floor: '3' });
    expect(edited.floor).toBe('3');
  });
});

describe('nominatim geocoder', () => {
  it('asks in Arabic, caches, and shapes the result', async () => {
    const calls: string[] = [];
    const fake = (async (url: string) => {
      calls.push(url);
      return new Response(
        JSON.stringify({
          lat: '30.99',
          lon: '31.37',
          name: '',
          display_name: 'طريق نقيطة، منية سندوب',
          address: { road: 'طريق نقيطة', village: 'منية سندوب', state: 'الدقهلية' },
        }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;
    const g = createNominatimGeocoder(fake);
    const p = await g.reverse({ lat: 30.99001, lng: 31.37001 });
    expect(p?.title).toBe('طريق نقيطة');
    expect(p?.road).toBe('طريق نقيطة');
    expect(p?.subtitle).toContain('منية سندوب');
    await g.reverse({ lat: 30.99002, lng: 31.37002 });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('accept-language=ar');
  });
  it('does not search for one letter', async () => {
    const g = createNominatimGeocoder((async () => {
      throw new Error('no');
    }) as unknown as typeof fetch);
    expect(await g.search('أ')).toEqual([]);
  });
});

describe('villageCenter', () => {
  it('opens on the village', () => {
    expect(villageCenter('منية سندوب').lat).toBeCloseTo(30.999, 2);
    expect(villageCenter('مكان مش معروف').lat).toBeTypeOf('number');
  });
});
