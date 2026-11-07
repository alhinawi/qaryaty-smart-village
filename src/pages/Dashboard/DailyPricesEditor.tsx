import { useEffect, useState } from 'react';
import { pricesRepo, type DailyPrice } from '@/repositories';
import { todaysPrices } from '@/utils/dailyPrices';
import type { Shop } from '@/types';
export function DailyPricesEditor({ shop }: { shop: Shop }) {
  const [item, setItem] = useState(''); const [unit, setUnit] = useState('كيلو'); const [price, setPrice] = useState('');
  const [rows, setRows] = useState<DailyPrice[]>([]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(timer); }, []);
  const current = todaysPrices(rows, now);
  const [readFailed, setReadFailed] = useState(false);
  async function reload() { try { setRows((await pricesRepo.list(shop.id)).filter(row => row.shopId === shop.id)); setReadFailed(false); setNow(new Date()); } catch { setRows([]); setReadFailed(true); } }
  useEffect(() => { let live = true; void pricesRepo.list(shop.id).then(next => { if (live) { setRows(next.filter(row => row.shopId === shop.id)); setNow(new Date()); } }).catch(() => { if (live) setReadFailed(true); }); return () => { live = false; }; }, [shop.id]);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function publish(event: React.FormEvent) {
    event.preventDefault(); if (busy || readFailed) return; setBusy(true); setMessage('');
    try { await pricesRepo.publish(shop.id, { item, unit, price: Number(price) }); setMessage('السعر اتنشر في لوحة النهارده. سعر المنتج في الطلب ماتغيّرش.'); setItem(''); setPrice(''); await reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'السعر ماتنشرش'); }
    finally { setBusy(false); }
  }
  return <section aria-label="نشر أسعار النهارده" className="bg-white border border-gold/30 rounded-2xl p-4 mb-4">
    <h2 className="m-0 font-black text-green-dark text-base">أسعار النهارده</h2>
    <p className="text-xs text-text-muted mt-1 leading-relaxed">انشر سعر الصنف لحد نهاية اليوم بتوقيت مصر. الإعلان مش بيعدّل سعر المنتج في الطلب.</p>
    <form onSubmit={publish} className="grid gap-2">
      <label className="text-xs font-bold">الصنف<input required maxLength={80} value={item} onChange={e => setItem(e.target.value)} placeholder="مثال: طماطم" className="block w-full rounded-xl border border-gold/30 p-2 mt-1" /></label>
      <div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold">السعر بالجنيه<input required type="number" inputMode="decimal" min="0.01" max="100000" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="block w-full rounded-xl border border-gold/30 p-2 mt-1" /></label><label className="text-xs font-bold">الوحدة<input required maxLength={30} value={unit} onChange={e => setUnit(e.target.value)} className="block w-full rounded-xl border border-gold/30 p-2 mt-1" /></label></div>
      <button disabled={busy || readFailed} className="rounded-xl bg-green-dark text-white text-sm font-bold p-3 disabled:opacity-50">{busy ? 'جاري النشر...' : 'انشر سعر النهارده'}</button>
    </form>
    {readFailed && <p className="text-xs text-text-muted">مش قادرين نحمّل الأسعار المنشورة دلوقتي.</p>}
    {current.length > 0 && <ul className="list-none m-0 mt-3 p-0 grid gap-2">{current.map(row => <li key={row.id} className="text-xs flex gap-2 items-center"><span className="min-w-0 flex-1 break-words">{row.item} · {row.price} ج.م / {row.unit}</span><button disabled={busy} type="button" className="shrink-0 min-h-11 px-2 text-red-700 underline" onClick={async () => { if (busy || readFailed) return; setBusy(true); setMessage(''); try { await pricesRepo.withdraw(row.id); await reload(); setMessage('السعر اتشال من لوحة النهارده'); } catch { setMessage('السعر ماتشالش. جرّب تاني'); } finally { setBusy(false); } }}>شيل الإعلان</button></li>)}</ul>}
    {message && <p role="status" className="text-xs leading-relaxed text-green-dark m-0 mt-2">{message}</p>}
  </section>;
}
