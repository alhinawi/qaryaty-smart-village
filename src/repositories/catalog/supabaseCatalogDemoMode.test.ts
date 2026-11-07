// Real mode must hide demo rows and skip every presentation-only demo append.
import { describe, expect, it } from 'vitest';
import { createSupabaseCatalogRepo } from './supabaseCatalogRepo';

interface FakeRow { [k: string]: unknown }

function fakeClient(tables: Record<string, FakeRow[]>) {
  return async () => ({
    from: (table: string) => {
      const rows = tables[table] ?? [];
      const filters: Array<(r: FakeRow) => boolean> = [];
      const builder = {
        select: () => builder,
        eq: (col: string, val: unknown) => {
          filters.push((r) => r[col] === val);
          return builder;
        },
        order: () => Promise.resolve({ data: rows.filter((r) => filters.every((f) => f(r))), error: null }),
      };
      return builder;
    },
  }) as never;
}

const realShop = { id: 900, name: 'محل حقيقي', kind: 'grocery', is_demo: false, hidden: false, open: true };
const demoShop = { id: 901, name: 'محل تجريبي', kind: 'grocery', is_demo: true, hidden: false, open: true };

describe('supabase catalog in real mode (demo off)', () => {
  it('returns only non-demo shops and adds no illustrative ones', async () => {
    const repo = createSupabaseCatalogRepo(fakeClient({ shops: [realShop, demoShop] }), () => false);
    const shops = await repo.getShops();
    expect(shops.map((s) => s.id)).toEqual([900]);
    expect(shops.length).toBe(1);
  });

  it('keeps the demo appends in demo mode', async () => {
    const repo = createSupabaseCatalogRepo(fakeClient({ shops: [realShop, demoShop] }), () => true);
    const shops = await repo.getShops();
    expect(shops.length).toBeGreaterThan(2);
  });

  it('filters demo services and providers too', async () => {
    const repo = createSupabaseCatalogRepo(
      fakeClient({
        services: [
          { id: 1, name: 'خدمة', hidden: false, is_demo: true },
          { id: 2, name: 'حقيقية', hidden: false, is_demo: false },
        ],
        providers: [{ id: 1, name: 'مقدم', active: true, is_demo: false }],
      }),
      () => false,
    );
    expect((await repo.getServices()).map((s) => s.id)).toEqual([2]);
    const providers = await repo.getProviders();
    expect(providers.map((p) => p.id)).toEqual([1]);
  });
});
