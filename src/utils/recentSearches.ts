// ─── Recent searches, kept on this device only
import { normalizeArabic } from '@/utils/arabicSearch';

export const MAX_RECENT_SEARCHES = 8;

/** Puts a search first, without repeats (the same words in another spelling count once). */
export function rememberSearch(history: string[], term: string): string[] {
  const trimmed = term.replace(/\s+/g, ' ').trim();
  if (!trimmed) return history;
  const key = normalizeArabic(trimmed);
  return [trimmed, ...history.filter((h) => normalizeArabic(h) !== key)].slice(0, MAX_RECENT_SEARCHES);
}
