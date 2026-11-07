import { useState } from 'react';
import { CalendarDays, Users, ChevronLeft, Check, PackageCheck } from 'lucide-react';
import { EVENT_SERVICES, EVENT_TYPES, eventEstimate, validEventDraft, type EventDraft } from './model';
const input = 'w-full mt-1 border border-green/20 rounded-xl bg-white text-text p-3 text-sm';
const card = 'bg-white border border-green/15 rounded-2xl p-4 mb-3';
const button = 'w-full rounded-xl bg-green text-white font-bold min-h-12 px-4 py-3 disabled:opacity-40';
const initial: EventDraft = { type: 'فرح', guests: 100, date: '', time: '', place: '', services: ['catering', 'tent', 'chairs'], note: '' };

export default function EventsPreview() {
  const [draft, setDraft] = useState<EventDraft>(() => { try { const stored: EventDraft = JSON.parse(sessionStorage.getItem('qaryati_event_preview') || 'null'); return stored && validEventDraft(stored) ? stored : initial; } catch { return initial; } }); const [step, setStep] = useState(1); const [saved, setSaved] = useState(false);
  const quote = eventEstimate(draft, []); // No approved event-provider listings exist in this preview.
  function patch<K extends keyof EventDraft>(key: K, value: EventDraft[K]) { setDraft(current => ({ ...current, [key]: value })); setSaved(false); }
  return <section className="max-w-xl mx-auto px-3 py-4">
    <div className="inline-block rounded-full px-3 py-1 text-[11px] bg-gold-light/20 text-green-dark mb-3">تصميم حجز المناسبات · مش حجز فعلي</div>
    <h1 className="text-2xl font-black text-green-dark m-0 flex gap-2 items-center"><CalendarDays size={25} /> مناسبتك من أهل قريتك</h1>
    <p className="text-sm text-text-muted mt-2 mb-4">الأكل والفراشة والتجهيزات في طلب واحد. كل مقدم خدمة بيأكد سعره وتفرغه قبل أي حجز.</p>
    <ol className="list-none p-0 flex gap-2 mb-4">{['المناسبة', 'الخدمات', 'مراجعة الطلب'].map((label,index) => <li key={label} className={`flex-1 text-center text-xs py-2 rounded-xl font-bold ${step === index+1 ? 'bg-green text-white' : 'bg-green/5 text-text-muted'}`}>{index+1} · {label}</li>)}</ol>
    {step === 1 && <div className={card}>
      <h2 className="text-base font-black text-green-dark mb-3">تفاصيل المناسبة</h2>
      <label className="text-xs font-bold">نوع المناسبة<select value={draft.type} onChange={e => patch('type', e.target.value as EventDraft['type'])} className={input}>{EVENT_TYPES.map(type=><option key={type}>{type}</option>)}</select></label>
      <label className="block mt-3 text-xs font-bold">عدد الضيوف<div className="relative"><input aria-label="عدد الضيوف" type="number" min="1" max="2000" value={draft.guests} onChange={e=>patch('guests',Number(e.target.value))} className={input} /><Users size={18} className="absolute end-3 top-5 text-green" aria-hidden="true" /></div></label>
      <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs font-bold min-w-0">التاريخ<input type="date" aria-label="التاريخ" value={draft.date} onChange={e=>patch('date',e.target.value)} className={`${input} min-w-0`} /></label><label className="text-xs font-bold min-w-0">الساعة<input type="time" aria-label="الساعة" value={draft.time} onChange={e=>patch('time',e.target.value)} className={`${input} min-w-0`} /></label></div>
      <label className="block mt-3 text-xs font-bold">المكان<input maxLength={200} value={draft.place} onChange={e=>patch('place',e.target.value)} placeholder="القرية والشارع أو اسم القاعة" className={input} /></label>
      <p className="text-[11px] text-text-muted mt-2">التاريخ والساعة بتوقيت مصر.</p>
      <button className={`${button} mt-3`} disabled={!validEventDraft(draft)} onClick={()=>setStep(2)}>اختار الخدمات <ChevronLeft size={16} className="inline-block" /></button>
    </div>}
    {step === 2 && <>
      {EVENT_SERVICES.map(service=><label key={service.id} className={`${card} flex items-center gap-3 cursor-pointer`}><input type="checkbox" className="w-5 h-5 accent-green" checked={draft.services.includes(service.id)} onChange={e=>patch('services',e.target.checked?[...draft.services,service.id]:draft.services.filter(id=>id!==service.id))}/><span className="min-w-0"><strong className="text-sm text-green-dark">{service.name}</strong><span className="block text-xs text-text-muted mt-1">{service.hint}</span></span></label>)}
      <label className="block text-xs font-bold mb-3">تفاصيل مهمة للمناسبة<textarea rows={2} maxLength={1000} value={draft.note} onChange={e=>patch('note',e.target.value)} className={input} placeholder="مثال: تجهيزات في دور أرضي، تصوير للسيدات فقط" /></label>
      <button className={button} disabled={!validEventDraft(draft)} onClick={()=>setStep(3)}>راجع الطلب والأسعار</button><button className="py-3 text-green w-full font-bold" onClick={()=>setStep(1)}>رجوع</button>
    </>}
    {step === 3 && <>
      <div className={card}><h2 className="font-black text-green-dark text-base mb-2">طلب واحد · {draft.type}</h2><p className="text-sm m-0">{draft.guests} ضيف · {draft.date} · {draft.time}</p><p className="text-xs text-text-muted mt-2 break-words">{draft.place}</p></div>
      <div className={card}><h2 className="font-black text-green-dark text-base mb-3">السعر التقريبي قبل الحجز</h2>{quote.rows.map(row=><div key={row.service} className="border-b border-green/10 py-3 last:border-0"><strong className="text-sm">{EVENT_SERVICES.find(s=>s.id===row.service)?.name}</strong><p className="text-xs text-text-muted mt-1 mb-0">لسه مفيش مقدم خدمة مسجّل سعر للمناسبات هنا. محتاج عرض سعر.</p></div>)}<div className="bg-gold-light/10 rounded-xl p-3 mt-3"><p className="text-sm font-bold text-green-dark m-0">الإجمالي لسه مش متاح</p><p className="text-xs text-text-muted mt-1 mb-0">مش هنخمن أرقام. الإجمالي يظهر لما كل مقدم خدمة يسجّل سعره وتختار الخدمات.</p></div></div>
      <div className={card}><p className="text-xs leading-relaxed m-0 text-text-muted">مفيش دفع أو عمولة متضافة هنا. حفظ المسودة مش حجز ومش بيبعت طلب لحد، والمسودة بتتمسح بعد قفل جلسة المتصفح. بعد تفعيل الخدمة، كل مقدم خدمة لازم يأكد السعر والتفرغ.</p></div>
      <button className={button} onClick={()=>{try{sessionStorage.setItem('qaryati_event_preview',JSON.stringify(draft));setSaved(true);}catch{setSaved(false);}}}><PackageCheck size={18} className="inline-block" /> احفظ مسودة على الجهاز</button>
      {saved && <p role="status" className="text-xs text-green text-center mt-2"><Check size={16} className="inline-block" /> المسودة اتحفظت للجلسة دي على الجهاز بس. مفيش طلب اتبعت.</p>}
      <button className="py-3 text-green w-full font-bold" onClick={()=>setStep(2)}>عدّل الخدمات</button>
    </>}
  </section>;
}
