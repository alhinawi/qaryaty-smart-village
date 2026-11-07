// ─── عرض اليوم (merchant side): set a time-limited offer, stop it early
import { useEffect, useState } from 'react';
import { offersRepo, type DailyOffer } from '@/repositories';
import { countdownText } from '@/utils/countdown';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';
import type { Shop } from '@/types';

const DURATIONS = [2, 3, 4, 6];

export function OffersSection({ shop }: { shop: Shop }) {
  const showToast = useUIStore((s) => s.showToast);
  const [current, setCurrent] = useState<DailyOffer | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [hours, setHours] = useState(3);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    offersRepo
      .mineForShop(shop.id)
      .then((o) => {
        if (alive) setCurrent(o);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [shop.id]);

  const publish = async () => {
    if (!title.trim()) {
      showToast('⚠️ اكتب العرض الأول');
      return;
    }
    setBusy(true);
    try {
      const offer = await offersRepo.create(shop.id, shop.name, title, details, hours);
      setCurrent(offer);
      setTitle('');
      setDetails('');
      showToast('🔥 عرضك اتنشر وظهر للعملاء');
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
      await offersRepo.stop(current.id);
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
