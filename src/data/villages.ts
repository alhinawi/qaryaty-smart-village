// ─── Villages around Mansoura (مركز المنصورة، الدقهلية)
// People see providers from their own village; "اعرض القرى القريبة كمان" adds the ones in `nearby`.
// Neighbours go both ways: listing بدواي next to منية سندوب is enough.
// Edit this list to match the real roads; nothing else needs to change.

export const DEFAULT_VILLAGE = 'منية سندوب';
export const GOVERNORATE = 'الدقهلية';

/** "منية سندوب" → "منية سندوب - الدقهلية", as the profile and the header show it. */
export function villageLabel(village: string): string {
  return `${village} - ${GOVERNORATE}`;
}

const NEIGHBOURS: Record<string, string[]> = {
  'منية سندوب': ['بدواي', 'منية بدواي', 'ميت خميس', 'سلكا', 'شها'],
  'بدواي': ['منية بدواي', 'ميت خميس'],
  'ميت خميس': ['سلكا'],
  'سلكا': ['شها'],
  'تلبانة': [],
};

/** Every village people can pick, own village first. */
export const VILLAGES: string[] = [
  ...new Set([...Object.keys(NEIGHBOURS), ...Object.values(NEIGHBOURS).flat()]),
];

const NEARBY: Map<string, Set<string>> = new Map(VILLAGES.map((v) => [v, new Set<string>()]));
for (const [village, list] of Object.entries(NEIGHBOURS)) {
  for (const other of list) {
    NEARBY.get(village)!.add(other);
    NEARBY.get(other)!.add(village);
  }
}

/** The villages next to `village` (not including it). */
export function nearbyVillages(village: string): string[] {
  return [...(NEARBY.get(village) ?? [])];
}

const normalize = (text: string) =>
  text
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064a')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The known village a typed name means ("منيه سندوب، المنصورة" → منية سندوب),
 * or null when it is none of them.
 */
export function knownVillage(text: string | undefined | null): string | null {
  if (!text) return null;
  const typed = normalize(text);
  const exact = VILLAGES.find((v) => normalize(v) === typed);
  if (exact) return exact;
  // Longest first, so "منية بدواي" wins over "بدواي"
  const byLength = [...VILLAGES].sort((a, b) => b.length - a.length);
  return byLength.find((v) => typed.includes(normalize(v))) ?? null;
}
