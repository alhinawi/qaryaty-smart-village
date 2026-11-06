// ─── Addresses kept on this device (guests and the demo mode)
import { getBrowserStorage, readJson, writeJson, type KeyValueStorage } from '@/services/storage';
import type { UserAddress } from '@/types';
import { sortAddresses, type AddressRepo } from './types';

const KEY = 'qaryati_addresses';

export function createLocalAddressRepo(storage: KeyValueStorage = getBrowserStorage()): AddressRepo {
  const read = () => readJson<UserAddress[]>(storage, KEY, []);
  const write = (list: UserAddress[]) => writeJson(storage, KEY, list);

  return {
    async list() {
      return sortAddresses(read());
    },
    async add(draft, makeDefault = false) {
      const list = read();
      const isDefault = makeDefault || list.length === 0;
      const address: UserAddress = {
        ...draft,
        id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        isDefault,
        createdAt: new Date().toISOString(),
      };
      write([...list.map((a) => (isDefault ? { ...a, isDefault: false } : a)), address]);
      return address;
    },
    async update(id, draft) {
      const list = read();
      const current = list.find((a) => a.id === id);
      if (!current) throw new Error('العنوان ده مش موجود');
      const updated = { ...current, ...draft };
      write(list.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    async remove(id) {
      const list = read();
      const removed = list.find((a) => a.id === id);
      let left = list.filter((a) => a.id !== id);
      if (removed?.isDefault && left.length > 0) {
        const newest = sortAddresses(left.map((a) => ({ ...a, isDefault: false })))[0];
        left = left.map((a) => ({ ...a, isDefault: a.id === newest.id }));
      }
      write(left);
    },
    async setDefault(id) {
      write(read().map((a) => ({ ...a, isDefault: a.id === id })));
    },
  };
}
