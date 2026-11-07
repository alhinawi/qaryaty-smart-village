// ─── الأكتر طلبًا في القرية هذا الأسبوع: shops ranked by real orders in the
// last 7 days. Real mode: only real counts, hidden when fewer than 3 shops
// have orders. Demo mode: a sample ranking shows (still gated on the verified flag).
import { useEffect, useState } from 'react';
import type { Shop } from '@/types';
import { ShopMenuModal } from '@/components/modals/ShopMenuModal';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { topShopsRepo, type WeeklyTopShop } from '@/repositories';

const MIN_REAL_SHOPS = 3;
const RANKS = ['١', '٢', '٣', '٤', '٥'];

export function TopWeeklySection() {
  const [top, setTop] = useState<WeeklyTopShop[]>([]);
  const [menuShop, setMenuShop] = useState<Shop | null>(null);
  const shops = useCatalogStore((s) => s.shops);
  // Refetch when the demo switch flips or the first verified read lands
  const trackingDemo = useTrackingDemoMode();

  useEffect(() => {
    let alive = true;
    topShopsRepo
      .listWeekly(5)
      .then((list) => {
        if (alive) setTop(list);
      })
      .catch(() => {
        /* no ranking when the backend can't answer */
      });
    return () => {
      alive = false;
    };
  }, [trackingDemo]);

  const isSample = top.some((t) => t.isSample);
  // Shops not in the (mode-filtered) catalog never show — a demo shop's
  // orders can't leak into real mode even if a stale ranking arrives.
  const ranked = top
    .map((t) => ({ ...t, shop: shops.find((s) => s.id === t.shopId) }))
    .filter((t): t is WeeklyTopShop & { shop: Shop } => Boolean(t.shop));

  if (ranked.length === 0) return null;
  if (!isSample && ranked.length < MIN_REAL_SHOPS) return null;

  return (
    <section className="mb-6" dir="rtl" aria-label="الأكتر طلبًا هذا الأسبوع">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-black text-green-dark m-0">🏆 الأكتر طلبًا هذا الأسبوع</h2>
      </div>
      <div className="flex flex-col gap-2">
        {ranked.map((entry, i) => (
          <button
            key={entry.shopId}
            type="button"
            onClick={() => setMenuShop(entry.shop)}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-2.5 flex items-center gap-3 text-start cursor-pointer"
          >
            <span
              className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[15px] font-black ${
                i === 0 ? 'bg-gold-light text-green-dark' : 'bg-green-dark/5 text-green-dark'
              }`}
            >
              {RANKS[i] ?? i + 1}
            </span>
            <img src={entry.shop.photo} alt={entry.shop.name} loading="lazy" className="w-11 h-11 rounded-xl object-cover shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-black text-green-dark truncate">{entry.shop.name}</span>
              <span className="block text-[11px] font-bold text-text-muted">{entry.orderCount} طلب الأسبوع ده</span>
            </span>
            <span className="text-text-muted text-[16px] shrink-0">‹</span>
          </button>
        ))}
      </div>
      <ShopMenuModal shop={menuShop} onClose={() => setMenuShop(null)} />
    </section>
  );
}
