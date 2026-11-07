import { useEffect, useState } from 'react';
import { pricesRepo, type DailyPrice } from '@/repositories';
import { todaysPrices } from '@/utils/dailyPrices';

export function DailyPricesSection() {
  const [rows, setRows] = useState<DailyPrice[]>([]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let live = true;
    const load = () => { void pricesRepo.list().then(next => { if (live) { setRows(next); setNow(new Date()); } }).catch(() => { if (live) setRows([]); }); };
    load();
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    window.addEventListener('focus', load);
    return () => { live = false; clearInterval(timer); window.removeEventListener('focus', load); };
  }, []);
  const current = todaysPrices(rows, now).slice(0, 20);
  if (!current.length) return null;
  return (
    <section aria-label="أسعار المحلات النهارده" className="my-5 mx-4 rounded-2xl border border-gold/40 bg-white overflow-hidden">
      <header className="bg-green-dark text-white px-4 py-3">
        <h2 className="m-0 text-base font-black">أسعار المحلات النهارده</h2>
        <p className="m-0 mt-1 text-[11px] text-white/80">إعلانات من المحلات بالجنيه المصري. أكّد السعر مع المحل قبل الطلب.</p>
      </header>
      <ul className="m-0 p-0 list-none divide-y divide-gold/15">
        {current.map(row => <li key={row.id} className="px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1"><p className="m-0 font-black text-[14px] text-green-dark break-words">{row.item}</p><p className="m-0 mt-1 text-xs text-text-muted break-words">{row.shopName} · {new Date(row.updatedAt).toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })}</p></div>
          <div className="shrink-0 text-end"><strong className="text-green-dark text-lg">{row.price.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} <span className="text-xs">ج.م</span></strong><p className="m-0 text-xs text-text-muted max-w-28 break-words">/ {row.unit}</p></div>
        </li>)}
      </ul>
      <p className="m-0 px-4 py-2 text-[10px] text-text-muted bg-gold/5">اللوحة مش بتغيّر سعر المنتجات أو إجمالي الطلب تلقائيًا.</p>
    </section>
  );
}
