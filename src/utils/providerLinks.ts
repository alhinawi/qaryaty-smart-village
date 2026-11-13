// ─── Links on a provider's card (a certificate, sample lessons…)
// They come from the database as jsonb, so anything that is not a labelled
// https link is dropped: a card never renders a javascript: or empty link.
import type { ProviderLink } from '@/types';

const KINDS = new Set<ProviderLink['kind']>(['certificate', 'samples']);
const MAX_LINKS = 4;

export function safeProviderLinks(raw: unknown): ProviderLink[] {
  if (!Array.isArray(raw)) return [];
  const links: ProviderLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { label, url, kind } = item as Record<string, unknown>;
    if (typeof label !== 'string' || !label.trim() || typeof url !== 'string') continue;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.protocol !== 'https:') continue;
    links.push({
      label: label.trim(),
      url: parsed.href,
      ...(KINDS.has(kind as ProviderLink['kind']) && { kind: kind as ProviderLink['kind'] }),
    });
    if (links.length === MAX_LINKS) break;
  }
  return links;
}
