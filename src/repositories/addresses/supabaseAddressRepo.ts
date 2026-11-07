// ─── Addresses in Supabase (table `user_addresses`, see supabase/migrations)
// RLS lets each customer read and change only their own rows; the database keeps
// one default per person and makes the first address the default.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AddressDraft, UserAddress } from '@/types';
import { RepoError } from '../errors';
import { isRejectedByDatabase } from '../orders/supabaseOrderRepo';
import { sortAddresses, type AddressRepo } from './types';

const COLUMNS = 'id, label, lat, lng, street, building, floor, landmark, phone, is_default, created_at';
const REJECTED_MESSAGE = 'العنوان مااتحفظش، راجع البيانات وجرّب تاني';

interface AddressRow {
  id: string;
  label: string;
  lat: number;
  lng: number;
  street: string;
  building: string;
  floor: string;
  landmark: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
}

export function rowToAddress(row: AddressRow): UserAddress {
  return {
    id: row.id,
    label: row.label,
    lat: Number(row.lat),
    lng: Number(row.lng),
    street: row.street ?? '',
    building: row.building ?? '',
    floor: row.floor ?? '',
    landmark: row.landmark ?? '',
    phone: row.phone ?? '',
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export function draftToRow(draft: AddressDraft) {
  return {
    label: draft.label.trim(),
    lat: draft.lat,
    lng: draft.lng,
    street: draft.street.trim(),
    building: draft.building.trim(),
    floor: draft.floor.trim(),
    landmark: draft.landmark.trim(),
    phone: draft.phone.trim() || null,
  };
}

function check(error: { code?: string } | null) {
  if (!error) return;
  if (isRejectedByDatabase(error.code)) throw new RepoError('rejected', REJECTED_MESSAGE, { cause: error });
  throw error;
}

export function createSupabaseAddressRepo(getClient: () => Promise<SupabaseClient>): AddressRepo {
  return {
    async list() {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('user_addresses')
        .select(COLUMNS)
        .order('created_at', { ascending: false });
      check(error);
      return sortAddresses(((data ?? []) as AddressRow[]).map(rowToAddress));
    },
    async add(draft, makeDefault = false) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({ ...draftToRow(draft), ...(makeDefault ? { is_default: true } : {}) })
        .select(COLUMNS)
        .single();
      check(error);
      return rowToAddress(data as AddressRow);
    },
    async update(id, draft) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('user_addresses')
        .update(draftToRow(draft))
        .eq('id', id)
        .select(COLUMNS)
        .single();
      check(error);
      return rowToAddress(data as AddressRow);
    },
    async remove(id) {
      const supabase = await getClient();
      const { error } = await supabase.rpc('delete_saved_address', { p_id: id });
      if (error?.code === '23514') throw new RepoError('rejected', 'ضيف عنوان تاني الأول قبل ما تمسح عنوانك الأساسي.', { cause: error });
      check(error);
    },
    async setDefault(id) {
      const supabase = await getClient();
      // The trigger turns the old default off
      const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
      check(error);
    },
  };
}
