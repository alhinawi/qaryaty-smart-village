import { Link } from 'react-router';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { loadDemoModeSetting } from '@/repositories';
import { EVENT_PACKAGES, simulatedQuote, useEventSimulationStore, type EventSimulationBooking } from './simulation';
import { useEffect, useState } from 'react';
import { CalendarDays, Users, ChevronLeft, Check, PackageCheck } from 'lucide-react';
import { EVENT_SERVICES, EVENT_TYPES, validEventDraft, type EventDraft } from './model';
const input = 'w-full mt-1 border border-green/20 rounded-xl bg-white text-text p-3 text-sm';
const card = 'bg-white border border-green/15 rounded-2xl p-4 mb-3';
const button = 'w-full rounded-xl bg-green text-white font-bold min-h-12 px-4 py-3 disabled:opacity-40';
const initial: EventDraft = { type: 'فرح', guests: 100, date: '', time: '', place: '', services: ['catering', 'tent', 'chairs'], note: '' };

export default function EventsPreview() {
  const [draft, setDraft] = useState<EventDraft>(() => { try { const stored: EventDraft = JSON.parse(sessionStorage.getItem('qaryati_event_preview') || 'null'); return stored && validEventDraft(stored) ? stored : initial; } catch { return initial; } }); const [step, setStep] = useState(1); 
  const demo=useTrackingDemoMode(); const confirm=useEventSimulationStore(s=>s.confirm); const [booking,setBooking]=useState<EventSimulationBooking|null>(null);
  useEffect(()=>{void loadDemoModeSetting().catch(()=>{});},[]);
  const quote=simulatedQuote(draft);
  if(!demo)return null;
  function patch<K extends keyof EventDraft>(key: K, value: EventDraft[K]) { setDraft(current => ({ ...current, [key]: value })); setBooking(null); }
  return <section className="max-w-xl mx-auto px-3 py-4">
    
    <h1 className="text-2xl font-black text-green-dark m-0 flex gap-2 items-center"><CalendarDays size={25} /> مناسبتك من أهل قريتك</h1>
    <p className="text-sm text-text-muted mt-2 mb-4">الأكل والفراشة والتجهيزات في طلب واحد. كل مقدم خدمة بيأكد سعره وتفرغه قبل أي حجز.</p>
    <ol className="list-none p-0 flex gap-2 mb-4">{['المناسبة', 'الخدمات', 'مراجعة الطلب'].map((label,index) => <li key={label} className={`flex-1 text-center text-xs py-2 rounded-xl font-bold ${step === index+1 ? 'bg-green text-white' : 'bg-green/5 text-text-muted'}`}>{index+1} · {label}</li>)}</ol>
    {step === 1 && <div className={card}>
      <h2 className="text-base font-black text-green-dark mb-3">تفاصيل المناسبة</h2>
      <label className="text-xs font-bold">نوع المناسبة<select value={draft.type} onChange={e => patch('type', e.target.value as EventDraft['type'])} className={input}>{EVENT_TYPES.map(type=><option key={type}>{type}</option>)}</select></label>
      <label className="block mt-3 text-xs font-bold">عدد الضيوف · حتى150ضيف<div className="relative"><input aria-label="عدد الضيوف" type="number" min="1" max="150" value={draft.guests} onChange={e=>patch('guests',Number(e.target.value))} className={input} /><Users size={18} className="absolute end-3 top-5 text-green" aria-hidden="true" /></div></label>
      <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs font-bold min-w-0">التاريخ<input type="date" aria-label="التاريخ" value={draft.date} onChange={e=>patch('date',e.target.value)} className={`${input} min-w-0`} /></label><label className="text-xs font-bold min-w-0">الساعة<input type="time" aria-label="الساعة" value={draft.time} onChange={e=>patch('time',e.target.value)} className={`${input} min-w-0`} /></label></div>
      <label className="block mt-3 text-xs font-bold">المكان<input maxLength={200} value={draft.place} onChange={e=>patch('place',e.target.value)} placeholder="القرية والشارع أو اسم القاعة" className={input} /></label>
      <p className="text-[11px] text-text-muted mt-2">التاريخ والساعة بتوقيت مصر.</p>
      <button className={`${button} mt-3`} disabled={!validEventDraft(draft)||!quote} onClick={()=>setStep(2)}>اختار الخدمات <ChevronLeft size={16} className="inline-block" /></button>
    </div>}
    {step === 2 && <>
      {EVENT_SERVICES.map(service=><label key={service.id} className={`${card} flex items-center gap-3 cursor-pointer`}><input type="checkbox" className="w-5 h-5 accent-green" checked={draft.services.includes(service.id)} onChange={e=>patch('services',e.target.checked?[...draft.services,service.id]:draft.services.filter(id=>id!==service.id))}/><span className="min-w-0"><strong className="text-sm text-green-dark">{service.name}</strong><span className="block text-xs text-text-muted mt-1">{EVENT_PACKAGES.find(p=>p.service===service.id)?.name} · {EVENT_PACKAGES.find(p=>p.service===service.id)?.price.toLocaleString('ar-EG')} ج / {EVENT_PACKAGES.find(p=>p.service===service.id)?.unit==='guest'?'ضيف':'المناسبة'}</span><span className="block text-[11px] text-text-muted mt-1">{EVENT_PACKAGES.find(p=>p.service===service.id)?.includes}</span></span></label>)}
      <label className="block text-xs font-bold mb-3">تفاصيل مهمة للمناسبة<textarea rows={2} maxLength={1000} value={draft.note} onChange={e=>patch('note',e.target.value)} className={input} placeholder="مثال: تجهيزات في دور أرضي، تصوير للسيدات فقط" /></label>
      <button className={button} disabled={!validEventDraft(draft)||!quote} onClick={()=>setStep(3)}>راجع الطلب والأسعار</button><button className="py-3 text-green w-full font-bold" onClick={()=>setStep(1)}>رجوع</button>
    </>}
    {step === 3 && <>
      <div className={card}><h2 className="font-black text-green-dark text-base mb-2">طلب واحد · {draft.type}</h2><p className="text-sm m-0">{draft.guests} ضيف · {draft.date} · {draft.time}</p><p className="text-xs text-text-muted mt-2 break-words">{draft.place}</p></div>
      <div className={card}><h2 className="font-black text-green-dark text-base mb-3">السعر التقريبي قبل الحجز</h2>{quote?.lines.map(row=><div key={row.service} className="border-b border-green/10 py-3 last:border-0"><strong className="text-sm">{row.name}</strong><p className="text-xs text-text-muted mt-1 mb-0">{EVENT_PACKAGES.find(p=>p.service===row.service)?.includes}</p><p className="text-sm text-green font-bold mt-2 mb-0">{row.amount.toLocaleString('ar-EG')} ج</p></div>)}<div className="bg-gold-light/10 rounded-xl p-3 mt-3"><p className="text-lg font-bold text-green-dark m-0">الإجمالي التقريبي {quote?.total.toLocaleString('ar-EG')} ج</p><p className="text-xs text-text-muted mt-1 mb-0">{quote ? Math.round(quote.total/draft.guests).toLocaleString('ar-EG'):''} ج للضيف بعد توزيع التجهيزات</p></div></div>
      <div className={card}><p className="text-xs leading-relaxed m-0 text-text-muted">الباقات للمكان الأرضي داخل القرية. راجع الخدمات والعدد والمكان قبل تأكيد المناسبة، واتفق مع مقدم الخدمة على أي تفاصيل زيادة.</p></div>
      <button className={button} disabled={!quote||!!booking} onClick={()=>setBooking(confirm(draft))}><PackageCheck size={18} className="inline-block" /> {booking?'تم تأكيد المناسبة':'تأكيد المناسبة'}</button>
      {booking && <div role="status" className="bg-green/5 rounded-xl p-4 text-green mt-3"><p className="font-bold text-sm m-0"><Check size={18} className="inline-block" /> مناسبتك اتأكدت</p><p className="text-xs mt-2">رقم الطلب {booking.reference}</p><Link to="/orders" className="text-sm font-bold underline">تابعها من طلباتي</Link></div>}
      <button className="py-3 text-green w-full font-bold" onClick={()=>setStep(2)}>عدّل الخدمات</button>
    </>}
  </section>;
}
