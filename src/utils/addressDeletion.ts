import type { UserAddress } from '@/types';
export const LAST_ADDRESS_MESSAGE = 'ضيف عنوان تاني الأول قبل ما تمسح عنوانك الأساسي.';
export function canDeleteAddress(addresses: UserAddress[], id: string): boolean { return addresses.some(a => a.id === id) && addresses.length > 1; }
