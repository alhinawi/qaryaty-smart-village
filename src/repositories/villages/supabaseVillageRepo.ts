// ─── Villages from Supabase: public.search_villages(q, lim), readable without signing in
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError, UNAVAILABLE_MESSAGE } from '../errors';
import { normalizeArabic, villageOptionLabel, type VillageOption, type VillageRepo } from './types';

interface VillageRow {
  id: number;
  name: string;
  markaz: string | null;
  governorate: string;
  served: boolean;
  kind: VillageOption['kind'];
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function toVillageOption(row: VillageRow): VillageOption {
  const base = { name: row.name, markaz: row.markaz ?? '', governorate: row.governorate };
  return {
    ...base,
    id: row.id,
    served: Boolean(row.served),
    kind: row.kind ?? 'village',
    label: row.label || villageOptionLabel(base),
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  };
}

export function createSupabaseVillageRepo(getClient: () => Promise<SupabaseClient>): VillageRepo {
  // Same words typed twice (back-space, retyping) don't go to the server again
  const cache = new Map<string, VillageOption[]>();
  return {
    async search(query, limit = 20) {
      const q = normalizeArabic(query);
      if (q.length < 2) return [];
      const key = `${q}|${limit}`;
      const hit = cache.get(key);
      if (hit) return hit;
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('search_villages', { q, lim: limit });
      if (error) throw new RepoError('unavailable', UNAVAILABLE_MESSAGE, { cause: error });
      const list = ((data ?? []) as VillageRow[]).map(toVillageOption);
      if (cache.size > 200) cache.clear();
      cache.set(key, list);
      return list;
    },
  };
}
