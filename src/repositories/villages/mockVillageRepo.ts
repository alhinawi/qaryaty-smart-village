// ─── Demo mode (no Supabase): the villages around Mansoura from src/data/villages.ts
import { DEFAULT_VILLAGE, GOVERNORATE, VILLAGES } from '@/data/villages';
import { normalizeArabic, villageOptionLabel, type VillageOption, type VillageRepo } from './types';

const SAMPLE: VillageOption[] = VILLAGES.map((name, i) => {
  const base = { name, markaz: 'مركز المنصورة', governorate: GOVERNORATE };
  return {
    ...base,
    id: -(i + 1),
    served: name === DEFAULT_VILLAGE,
    kind: 'village' as const,
    label: villageOptionLabel(base),
    lat: null,
    lng: null,
  };
});

export function createMockVillageRepo(list: VillageOption[] = SAMPLE): VillageRepo {
  return {
    async search(query, limit = 20) {
      const q = normalizeArabic(query);
      if (q.length < 2) return [];
      const hits = list.filter((v) => {
        const key = normalizeArabic(v.name);
        return key.startsWith(q) || key.includes(` ${q}`);
      });
      return hits
        .sort((a, b) => Number(normalizeArabic(b.name).startsWith(q)) - Number(normalizeArabic(a.name).startsWith(q)) || Number(b.served) - Number(a.served))
        .slice(0, limit);
    },
  };
}
