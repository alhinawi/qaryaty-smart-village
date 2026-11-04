// ─── Arabic-aware search
// People type the same word many ways: مُدَرِّس / مدرس, أكل / اكل, جزارة / جزاره, مستشفى / مستشفي.
// We normalize both the query and the text before comparing.

const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

export function normalizeArabic(text: string): string {
  return text
    .normalize('NFC')
    .replace(TASHKEEL, '')
    .replace(TATWEEL, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // آ أ إ ٱ → ا
    .replace(/\u0629/g, '\u0647') // ة → ه
    .replace(/\u0649/g, '\u064A') // ى → ي
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * true when every word of the query appears in at least one of the fields.
 * An empty query matches everything.
 */
export function matchesSearch(
  query: string,
  fields: Array<string | undefined | null>
): boolean {
  const tokens = normalizeArabic(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = fields
    .filter((f): f is string => Boolean(f))
    .map(normalizeArabic)
    .join(' ');
  return tokens.every((token) => haystack.includes(token));
}
