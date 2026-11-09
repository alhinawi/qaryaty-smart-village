// ─── جمعية preview (demo only): Money Fellows-style managed circle plus the
// village-organizer circle. No real money, no gateway, all numbers are clearly
// marked placeholders pending the owner's decisions.
import React, { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Bell, CalendarDays, HandCoins, ShieldCheck, Users } from 'lucide-react';

type Kind = 'managed' | 'village' | null;
const DURATIONS = [3, 6, 12];
const AMOUNTS = [100, 250, 500];
const SLOTS = [
  { id: 'early', label: 'بدري', hint: 'تقبض في أول تلت', feePct: 6, fee: 'رسوم خدمة 6% (رقم توضيحي)' },
  { id: 'mid', label: 'في النص', hint: 'تقبض في نص المدة', feePct: 3, fee: 'رسوم خدمة 3% (رقم توضيحي)' },
  { id: 'late', label: 'في الآخر', hint: 'تقبض آخر واحد', feePct: 0, fee: 'من غير رسوم + مكافأة (توضيحي)' },
] as const;

const DEMO_MEMBERS = [
  { name: 'أم محمد', slot: 'الدور 1', paid: true, trusted: true },
  { name: 'الحاج متولي', slot: 'الدور 2', paid: true, trusted: true },
  { name: 'أسطى رزق', slot: 'الدور 3', paid: false, trusted: false },
  { name: 'الحاجة سناء', slot: 'الدور 4', paid: false, trusted: true },
];

export default function GamiyaPreviewPage() {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<Kind>(null);
  const [months, setMonths] = useState(6);
  const [amount, setAmount] = useState(250);
  const [slot, setSlot] = useState<(typeof SLOTS)[number]['id']>('mid');
  const total = useMemo(() => months * amount, [months, amount]);
  const slotInfo = SLOTS.find((s) => s.id === slot)!;
  const payout = Math.round(total * (1 - slotInfo.feePct / 100));
  const fmt = (n: number) => n.toLocaleString('en-US');

  const goVillage = () => { window.location.href = '/services/45'; };

  return (
    <div dir="rtl" className="max-w-md mx-auto px-4 pb-28 pt-4">
      <div className="rounded-2xl bg-gold/15 border border-gold/40 text-[12px] font-bold text-text px-3 py-2 mb-4 flex items-center gap-2">
        <ShieldCheck size={16} className="text-green shrink-0" />
        معاينة تجريبية - مفيش فلوس حقيقية ولا دفع فعلي، والأرقام كلها توضيحية مستنية قرارك.
      </div>

      {step === 0 && (
        <section aria-label="اختار نوع الجمعية">
          <p className="text-[11px] font-black text-text-muted m-0 mb-1">شاشة 1 من 4</p>
          <h1 className="text-xl font-black text-green-dark m-0 mb-1">الجمعية في قريتي</h1>
          <p className="text-[13px] text-text-muted m-0 mb-4">اختار الجمعية تتدار إزاي:</p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setKind('managed'); setStep(1); }}
              className="w-full text-right bg-white rounded-2xl border-2 border-green/60 shadow-md p-4 hover:border-green transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-9 h-9 rounded-xl bg-green flex items-center justify-center text-white"><HandCoins size={18} /></span>
                <h2 className="text-[15px] font-black text-text m-0">جمعية قريتي المُدارة</h2>
                <span className="mr-auto text-[10px] font-black bg-green/10 text-green rounded-lg px-2 py-1">زي Money Fellows</span>
              </div>
              <p className="text-[12px] text-text-muted m-0 leading-relaxed">
                التطبيق بيدير كل حاجة: تحديد الأدوار، تذكير الدفع، ومتابعة القبض. في رسوم خدمة على اللي يقبض بدري.
              </p>
              <span className="inline-flex items-center gap-1 text-green font-black text-[12px] mt-2">ابدأ جمعية مُدارة <ArrowRight size={14} className="rotate-180" /></span>
            </button>
            <button
              type="button"
              onClick={() => { setKind('village'); goVillage(); }}
              className="w-full text-right bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-4 hover:border-green transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-9 h-9 rounded-xl bg-green/10 flex items-center justify-center text-green"><Users size={18} /></span>
                <h2 className="text-[15px] font-black text-text m-0">جمعية منظّم من القرية</h2>
                <span className="mr-auto text-[10px] font-black bg-gold/20 text-[#8a6100] rounded-lg px-2 py-1">من غير رسوم</span>
              </div>
              <p className="text-[12px] text-text-muted m-0 leading-relaxed">
                منظّم متطوع من أهل القرية بينظّمها زي العادة، والتطبيق مكان للإعلان والحجز بس.
              </p>
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="المدة والقسط">
          <p className="text-[11px] font-black text-text-muted m-0 mb-1">شاشة 2 من 4</p>
          <h1 className="text-xl font-black text-green-dark m-0 mb-4">المدة والقسط الشهري</h1>
          <h2 className="text-[13px] font-black text-text mb-2">مدة الجمعية</h2>
          <div className="flex gap-2 mb-4" role="radiogroup" aria-label="مدة الجمعية">
            {DURATIONS.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={months === m} onClick={() => setMonths(m)}
                className={`flex-1 rounded-xl border-2 py-3 text-[14px] font-black transition-colors ${months === m ? 'bg-green text-white border-green' : 'bg-white text-text border-gray-200'}`}>
                {m} شهور
              </button>
            ))}
          </div>
          <h2 className="text-[13px] font-black text-text mb-2">القسط الشهري</h2>
          <div className="flex gap-2 mb-4" role="radiogroup" aria-label="القسط الشهري">
            {AMOUNTS.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={amount === a} onClick={() => setAmount(a)}
                className={`flex-1 rounded-xl border-2 py-3 text-[14px] font-black transition-colors ${amount === a ? 'bg-green text-white border-green' : 'bg-white text-text border-gray-200'}`}>
                {fmt(a)} ج
              </button>
            ))}
          </div>
          <div className="bg-green-dark text-white rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[13px] font-bold flex items-center gap-2"><CalendarDays size={16} /> إجمالي الجمعية</span>
            <span className="text-lg font-black">{fmt(total)} جنيه</span>
          </div>
          <button type="button" onClick={() => setStep(2)} className="mt-4 w-full bg-green text-white rounded-2xl py-3.5 text-[15px] font-black">التالي: دور القبض</button>
          <button type="button" onClick={() => setStep(0)} className="mt-2 w-full text-green font-bold text-[13px] py-2">رجوع</button>
        </section>
      )}

      {step === 2 && (
        <section aria-label="دور القبض">
          <p className="text-[11px] font-black text-text-muted m-0 mb-1">شاشة 3 من 4</p>
          <h1 className="text-xl font-black text-green-dark m-0 mb-1">اختار دور القبض</h1>
          <p className="text-[12px] text-text-muted m-0 mb-4">اللي يقبض بدري بيدفع رسوم خدمة أكتر، واللي يستنى للآخر بياخد أقل رسوم.</p>
          <div className="space-y-2 mb-3" role="radiogroup" aria-label="دور القبض">
            {SLOTS.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={slot === s.id} onClick={() => setSlot(s.id)}
                className={`w-full text-right rounded-2xl border-2 p-4 transition-colors ${slot === s.id ? 'bg-green text-white border-green' : 'bg-white text-text border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-black">{s.label}</span>
                  <span className={`text-[11px] font-bold rounded-lg px-2 py-1 ${slot === s.id ? 'bg-white/15 text-white' : 'bg-gold/20 text-[#8a6100]'}`}>{s.fee}</span>
                </div>
                <p className={`text-[12px] m-0 mt-1 ${slot === s.id ? 'text-white/85' : 'text-text-muted'}`}>{s.hint}</p>
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-green/20 p-4 mb-3">
            <div className="flex justify-between text-[13px] font-bold text-text"><span>إجمالي الجمعية</span><span>{fmt(total)} ج</span></div>
            <div className="flex justify-between text-[13px] font-bold text-text mt-1"><span>رسوم الخدمة ({slotInfo.feePct}%)</span><span>- {fmt(total - payout)} ج</span></div>
            <div className="border-t border-dashed border-gray-200 my-2" />
            <div className="flex justify-between text-[15px] font-black text-green-dark"><span>هتقبض</span><span>{fmt(payout)} جنيه</span></div>
          </div>
          <p className="text-[11px] text-text-muted m-0 mb-3">النسب دي أرقام توضيحية للمعاينة بس - النسبة النهائية قرار صاحب التطبيق.</p>
          <button type="button" onClick={() => setStep(3)} className="w-full bg-green text-white rounded-2xl py-3.5 text-[15px] font-black">التالي: المتابعة</button>
          <button type="button" onClick={() => setStep(1)} className="mt-2 w-full text-green font-bold text-[13px] py-2">رجوع</button>
        </section>
      )}

      {step === 3 && (
        <section aria-label="متابعة الجمعية">
          <p className="text-[11px] font-black text-text-muted m-0 mb-1">شاشة 4 من 4</p>
          <h1 className="text-xl font-black text-green-dark m-0 mb-1">جمعيتك شغالة</h1>
          <p className="text-[12px] text-text-muted m-0 mb-4">{months} شهور × {fmt(amount)} ج - دورك: {slotInfo.label}</p>
          <div className="bg-white rounded-2xl border border-green/15 p-4 mb-3">
            <div className="flex justify-between text-[12px] font-bold text-text-muted mb-2"><span>قسط شهر 2 من {months}</span><span>2 / {DEMO_MEMBERS.length} دفعوا</span></div>
            <div className="h-2.5 rounded-full bg-green/10 overflow-hidden"><div className="h-full w-1/2 bg-green rounded-full" /></div>
          </div>
          <div className="space-y-2">
            {DEMO_MEMBERS.map((m) => (
              <div key={m.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-black ${m.paid ? 'bg-green' : 'bg-gray-300'}`}>{m.name[0]}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-black text-text m-0 flex items-center gap-1">
                    {m.name}
                    {m.trusted && <BadgeCheck size={14} className="text-green" aria-label="موثوق" />}
                  </p>
                  <p className="text-[11px] text-text-muted m-0">{m.slot}</p>
                </div>
                {m.paid ? (
                  <span className="text-[11px] font-black text-green bg-green/10 rounded-lg px-2 py-1">دفع</span>
                ) : (
                  <button type="button" className="inline-flex items-center gap-1 text-[11px] font-black text-[#8a6100] bg-gold/20 rounded-lg px-2 py-1.5">
                    <Bell size={12} /> فتّكره
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-muted m-0 mt-3">التذكير والتحصيل هنا تجريبيين - مفيش خصم ولا تحويل حقيقي في المعاينة.</p>
          <button type="button" onClick={() => setStep(0)} className="mt-3 w-full text-green font-bold text-[13px] py-2">من الأول</button>
        </section>
      )}
    </div>
  );
}
