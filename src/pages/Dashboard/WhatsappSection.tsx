// ─── واتساب الطلبات (merchant side): opt-in + number + message preview
// The actual sending needs a WhatsApp Business provider (paid) — this section
// collects the merchant's number and choice and shows exactly what he'll get.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { saveShopWhatsapp, settingsRepo } from '@/repositories';
import { useProviderDashboardStore } from '@/stores/useProviderDashboardStore';
import { useUIStore } from '@/stores/useUIStore';
import { normalizeEgyptianPhone } from '@/utils/validators';
import type { Shop } from '@/types';

/** The message the merchant gets on every new order (template preview). */
export function orderWhatsappTemplate(shopName: string): { body: string; button: string } {
  return {
    body: `🛒 طلب جديد من قريتي!\n\nالطلب: 2 عيش بلدي + 1 جبنة\nالعنوان: منية سندوب - شارع المدرسة\nالموبايل: 01012345678\nالإجمالي: 45 جنيه كاش\n\nدوس «قبول الطلب» عشان تبدأ تجهزه، أو افتح ${shopName} في التطبيق.`,
    button: '✅ قبول الطلب',
  };
}

export function WhatsappSection({ shop }: { shop: Shop }) {
  const overrides = useProviderDashboardStore((s) => s.merchants[shop.id]);
  const setShopWhatsapp = useProviderDashboardStore((s) => s.setShopWhatsapp);
  const showToast = useUIStore((s) => s.showToast);
  const [phone, setPhone] = useState(overrides?.whatsappPhone ?? '');
  const [optIn, setOptIn] = useState(overrides?.whatsappOptIn ?? false);
  const [saved, setSaved] = useState(false);
  // The owner's master switch (app_settings.whatsapp_notifications): while it
  // is OFF no merchant sees the opt-in as active, and the DB trigger queues
  // nothing. A failed read fails closed.
  const [master, setMaster] = useState<'loading' | 'off' | 'on'>('loading');
  useEffect(() => {
    let alive = true;
    settingsRepo
      .getWhatsappEnabled()
      .then((on) => {
        if (alive) setMaster(on ? 'on' : 'off');
      })
      .catch(() => {
        if (alive) setMaster('off');
      });
    return () => {
      alive = false;
    };
  }, []);
  const template = orderWhatsappTemplate(shop.name);

  const save = () => {
    const normalized = normalizeEgyptianPhone(phone);
    if (optIn && !normalized) {
      showToast('⚠️ اكتب رقم واتساب صحيح (01xxxxxxxxx)');
      return;
    }
    setShopWhatsapp(shop.id, normalized ?? phone.trim(), optIn);
    setSaved(true);
    showToast(optIn ? '✅ هتوصلك الطلبات الجديدة على واتساب' : '✅ إشعارات الواتساب اتقفلت');
    // Best-effort sync to the shop row (live mode); the local mirror already saved.
    void saveShopWhatsapp(shop.id, normalized ?? phone.trim(), optIn).catch(() => {
      showToast('⚠️ اتحفظ على الجهاز بس — الإعداد على السيرفر ماتحفظش');
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] p-4 mb-4" dir="rtl">
      <h3 className="text-[15px] font-black text-green-dark m-0 mb-1">🟢 واتساب الطلبات</h3>
      <p className="text-[12px] text-text-muted leading-relaxed m-0 mb-3">
        كل طلب جديد يوصلك رسالة واتساب فيها التفاصيل وزرار «قبول الطلب» — من غير ما تفتح الموقع.
      </p>

      {master !== 'on' && (
        <p className="text-[12px] font-bold text-text-muted bg-gray-100 rounded-xl px-3 py-2.5 m-0 mb-3">
          ⏸️ الخدمة متوقفة مؤقتًا من إدارة الموقع — هتتفعل قريب وهنبلغك أول ما تشتغل.
        </p>
      )}

      {master === 'on' && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaved(false);
              }}
              placeholder="رقم الواتساب (01xxxxxxxxx)"
              inputMode="tel"
              dir="ltr"
              className="flex-1 min-h-[46px] rounded-xl border border-[rgba(26,122,74,0.25)] px-3 text-[16px] font-bold font-['Cairo',sans-serif] text-left"
            />
            <button
              type="button"
              role="switch"
              aria-checked={optIn}
              aria-label="تفعيل واتساب الطلبات"
              onClick={() => {
                setOptIn(!optIn);
                setSaved(false);
              }}
              className={`shrink-0 w-14 h-8 rounded-full p-1 transition-colors duration-200 cursor-pointer border-none ${optIn ? 'bg-green' : 'bg-gray-300'}`}
            >
              <span className={`block w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${optIn ? '-translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <Button onClick={save} className="w-full min-h-[46px] mb-3" variant={saved ? 'outline' : 'primary'}>
            {saved ? '✅ محفوظ' : 'حفظ الإعداد'}
          </Button>
        </>
      )}

      {/* WhatsApp bubble preview */}
      <p className="text-[12px] font-extrabold text-text-muted m-0 mb-1.5">شكل الرسالة اللي هتوصلك:</p>
      <div className="bg-[#0b141a] rounded-xl p-3" dir="rtl">
        <div className="bg-[#005c4b] rounded-xl rounded-tr-sm p-3 max-w-[95%]">
          <p className="text-[13px] text-white leading-relaxed whitespace-pre-line m-0">{template.body}</p>
          <p className="text-[10px] text-white/60 text-left m-0 mt-1" dir="ltr">10:24 ✓✓</p>
        </div>
        <div className="mt-2 bg-[#1f2c34] rounded-lg py-2.5 text-center text-[14px] font-bold text-[#53bdeb]">
          {template.button}
        </div>
      </div>
    </section>
  );
}
