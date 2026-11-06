// ─── عناويني: the saved addresses of whoever is using the app
// Signed in → the account's addresses in Supabase; guest → this device.
import { create } from 'zustand';
import { addressRepoFor } from '@/repositories';
import type { AddressDraft, UserAddress } from '@/types';
import { sortAddresses } from '@/repositories/addresses/types';
import { useAuthStore } from './useAuthStore';

interface AddressState {
  addresses: UserAddress[];
  /** The account (or 'guest') the list belongs to; null before the first load. */
  owner: string | null;
  loading: boolean;
  error: string;
  /** Loads the list once per account; pass force to read it again. */
  load: (force?: boolean) => Promise<void>;
  save: (draft: AddressDraft, id?: string, makeDefault?: boolean) => Promise<UserAddress>;
  remove: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

function currentOwner(): string {
  return useAuthStore.getState().session?.user.id ?? 'guest';
}

function repo() {
  return addressRepoFor(currentOwner() !== 'guest');
}

export const useAddressStore = create<AddressState>()((set, get) => ({
  addresses: [],
  owner: null,
  loading: false,
  error: '',

  load: async (force = false) => {
    const owner = currentOwner();
    if (!force && get().owner === owner && !get().error) return;
    set({ loading: true, error: '', owner, ...(get().owner !== owner ? { addresses: [] } : {}) });
    try {
      const addresses = await repo().list();
      if (currentOwner() === owner) set({ addresses, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'معرفناش نجيب عناوينك' });
    }
  },

  save: async (draft, id, makeDefault = false) => {
    const r = repo();
    let saved = id ? await r.update(id, draft) : await r.add(draft, makeDefault);
    if (id && makeDefault && !saved.isDefault) {
      await r.setDefault(id);
      saved = { ...saved, isDefault: true };
    }
    const others = get().addresses.filter((a) => a.id !== saved.id);
    set({
      addresses: sortAddresses([
        ...others.map((a) => (saved.isDefault ? { ...a, isDefault: false } : a)),
        saved,
      ]),
    });
    return saved;
  },

  remove: async (id) => {
    await repo().remove(id);
    // The default may have moved to another address
    await get().load(true);
  },

  setDefault: async (id) => {
    await repo().setDefault(id);
    set({ addresses: sortAddresses(get().addresses.map((a) => ({ ...a, isDefault: a.id === id }))) });
  },
}));

/** The address to use when nothing else was picked. */
export const selectDefaultAddress = (s: AddressState) => s.addresses.find((a) => a.isDefault) ?? s.addresses[0] ?? null;
