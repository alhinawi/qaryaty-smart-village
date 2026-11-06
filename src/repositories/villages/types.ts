// ─── Villages of Egypt (the "القرية" picker)
// The list lives in Supabase (`villages`, ~12k rows from Wikidata, GeoNames and OpenStreetMap,
// placed in their markaz with CAPMAS boundaries). See supabase/migrations/20261106160000_villages.sql.

export interface VillageOption {
  id: number;
  name: string;
  /** مركز المنصورة, or '' when unknown. */
  markaz: string;
  governorate: string;
  /** We deliver there. */
  served: boolean;
  kind: 'village' | 'hamlet' | 'city';
  /** "منية سندوب، مركز المنصورة - الدقهلية": what is saved in profiles.village. */
  label: string;
  lat: number | null;
  lng: number | null;
}

export interface VillageRepo {
  /** Best matches for what the person typed (2 letters or more), served villages first. */
  search(query: string, limit?: number): Promise<VillageOption[]>;
}

/** One spelling for search: أ/إ/آ → ا, ة → ه, ى → ي, no harakat. Same as public.ar_normalize(). */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640\u200E\u200F]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064a')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064a')
    .replace(/[،,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The saved text for a village: name, markaz and governorate. */
export function villageOptionLabel(v: Pick<VillageOption, 'name' | 'markaz' | 'governorate'>): string {
  return `${v.name}${v.markaz ? `، ${v.markaz}` : ''} - ${v.governorate}`;
}
