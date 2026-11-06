// ─── Saved addresses repository (عناويني)
import type { AddressDraft, UserAddress } from '@/types';

export interface AddressRepo {
  /** Newest first, the default on top. */
  list(): Promise<UserAddress[]>;
  add(draft: AddressDraft, makeDefault?: boolean): Promise<UserAddress>;
  update(id: string, draft: AddressDraft): Promise<UserAddress>;
  remove(id: string): Promise<void>;
  setDefault(id: string): Promise<void>;
}

export function sortAddresses(list: UserAddress[]): UserAddress[] {
  return [...list].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt.localeCompare(a.createdAt)
  );
}
