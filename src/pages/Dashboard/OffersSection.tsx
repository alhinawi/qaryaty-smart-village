import {isSupabaseConfigured} from '@/repositories/supabaseClient';
// ─── عرض اليوم (merchant side): set a time-limited offer, stop it early
import { useEffect, useState } from 'react';
import { offersRepo, type DailyOffer } from '@/repositories';
import { countdownText } from '@/utils/countdown';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';
import {useAuthStore} from '@/stores/useAuthStore';
import {useTrackingDemoMode} from '@/hooks/useTrackingDemoMode';
import {createLocalOffersRepo} from '@/repositories/offers/localOffersRepo';
import {useCatalogStore} from '@/stores/useCatalogStore';
import type { Shop } from '@/types';

const DURATIONS = [2, 3, 4, 6];

export function OffersSection({ shop }: { shop: Shop }) {
  const offerScope=useAuthStore(s=>s.session?.user.id??'guest');
  const trackingDemo=useTrackingDemoMode();
  const structuredLocal = (shop.demo || !isSupabaseConfigured) && trackingDemo;
  const repo=(shop.demo||!isSupabaseConfigured)&&trackingDemo?createLocalOffersRepo(offerScope):offersRepo;
  const showToast = useUIStore((s) => s.showToast);
  const [current, setCurrent] = useState<DailyOffer | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [hours, setHours] = useState(3);
  const [busy, setBusy] = useState(false);
  const [productId,setProductId]=useState('');
  const [percentOff,setPercentOff]=useState(20);
  const products=useCatalogStore(s=>s.products[shop.id]);
  const loadProducts=useCatalogStore(s=>s.loadProducts);
  useEffect(()=>{void loadProducts(shop)},[shop,loadProducts]);

  useEffect(() => {
    let alive = true;
    ((shop.demo||!isSupabaseConfigured)&&trackingDemo?createLocalOffersRepo(offerScope):offersRepo)
      .mineForShop(shop.id)
      .then((o) => {
        if (alive) setCurrent(o);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [shop.id,shop.demo,trackingDemo,offerScope]);

  const publish = async () => {
    if (structuredLocal && (!productId||!Number.isInteger(percentOff)||percentOff<1||percentOff>99)){showToast('اختار المنتج ونسبة خصم من1 إلى99');return;}
    if (!title.trim()) {
      showToast('⚠️ اكتب العرض الأول');
      return;
    }
    setBusy(true);
    try {
      const offer = await repo.create(shop.id, shop.name, title, details, hours,structuredLocal?{productId,percentOff}:undefined);
      setCurrent(offer);
      setTitle('');
      setDetails('');
      showToast('✅ عرضك اتحفظ، وبيظهر للعملاء مع تحديث العروض');
    } catch (error) {
      showToast(error instanceof Error ? `⚠️ ${error.message}` : '⚠️ العرض ماتحفظش');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await repo.stop(current.id);
      setCurrent(null);
      showToast('✅ العرض اتوقف');
    } catch {
      showToast('⚠️ ماقدرناش نوقف العرض');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] p-4 mb-4" dir="rtl">
      <h3 className="text-[15px] font-black text-green-dark m-0 mb-1">🔥 عرض اليوم</h3>
      <p className="text-[12px] text-text-muted leading-relaxed m-0 mb-3">
        عرض بوقت محدود يظهر للعملاء على الصفحة الرئيسية مع عدّاد، وبيختفي لوحده لما الوقت يخلص.
      </p>

      {current ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-black m-0">{current.title}</p>
            <p className="text-[12px] text-text-muted m-0 mt-0.5">{countdownText(current.endsAt)}</p>
          </div>
          <Button variant="danger" size="sm" disabled={busy} onClick={() => void stop()} className="shrink-0 min-h-[38px]">
            وقّف العرض
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {structuredLocal && <><label className="text-xs font-bold">المنتج المشمول بالخصم<select aria-label="منتج العرض" value={productId} onChange={e=>setProductId(e.target.value)} className="block w-full bg-white rounded-xl border border-green/25 p-3 mt-1"><option value="">اختار منتج</option>{Array.isArray(products)&&products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="text-xs font-bold">نسبة الخصم %<input aria-label="نسبة الخصم" type="number" min="1" max="99" step="1" value={percentOff} onChange={e=>setPercentOff(Number(e.target.value))} className="block w-full rounded-xl border border-green/25 p-3 mt-1"/></label>
          <p className="text-xs text-text-muted m-0">الخصم على سعر المنتج بس. رسوم التوصيل والشوي وقواعد عمولة التطبيق زي ما هي.</p></>}
          <input
            aria-label="عنوان العرض"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="العرض (مثال: خصم 20% على الغدا)"
            maxLength={80}
            className="w-full min-h-[46px] rounded-xl border border-[rgba(26,122,74,0.25)] px-3 text-[16px] font-bold font-['Cairo',sans-serif]"
          />
          <input
            aria-label="تفاصيل العرض"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="تفاصيل زيادة (اختياري)"
            maxLength={120}
            className="w-full min-h-[46px] rounded-xl border border-[rgba(26,122,74,0.25)] px-3 text-[16px] font-['Cairo',sans-serif]"
          />
          <div role="group" aria-label="مدة العرض" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <span className="col-span-full text-[13px] font-bold text-text-muted">مدة العرض:</span>


            {DURATIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={`min-h-[38px] px-3 rounded-xl text-[13px] font-extrabold cursor-pointer border-2 transition-colors ${
                  hours === h ? 'bg-green text-white border-green' : 'bg-white text-green border-[rgba(26,122,74,0.3)]'
                }`}
              >
                {h} ساعات
              </button>
            ))}
          </div>
          <Button onClick={() => void publish()} disabled={busy} className="w-full min-h-[46px]">
            {busy ? '⏳ بينشر...' : '🔥 انشر العرض'}
          </Button>
        </div>
      )}
    </section>
  );
}
