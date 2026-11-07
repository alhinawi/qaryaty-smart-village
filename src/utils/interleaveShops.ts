import type { Shop } from '@/types';

/** Stable category variety, no mutation. Keep each category's existing order. */
export function interleaveShops(shops: Shop[]): Shop[] {
  const buckets = new Map<string, Shop[]>();
  for (const shop of shops) {
    const kind = shop.kind ?? 'other';
    if (!buckets.has(kind)) buckets.set(kind, []);
    buckets.get(kind)!.push(shop);
  }
  const result: Shop[] = [];
  let previous: string | undefined;
  while (result.length < shops.length) {
    // One from every category each round, not a block of the biggest kinds.
    for (const [kind, rows] of buckets) {
      if (!rows.length) continue;
      if (kind === previous && [...buckets].some(([k, r]) => k !== previous && r.length)) continue;
      result.push(rows.shift()!);
      previous = kind;
    }
  }
  return result;
}
