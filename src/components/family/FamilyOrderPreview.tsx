import { useState } from 'react';
import { ArrowLeft, Check, Clock, Link, ShieldCheck, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';

import { validRecipient, type Recipient } from './validation';
/** Interaction prototype only. Never creates public links, orders or payments. */
export function FamilyOrderPreview({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'sender' | 'recipient' | 'review'>('sender');
  const [recipient, setRecipient] = useState<Recipient>({ name: '', village: '', address: '', phone: '' });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const field = (key: keyof Recipient, value: string) => setRecipient(r => ({ ...r, [key]: value }));
  return <Modal isOpen onClose={onClose} title={step === 'recipient' ? 'بيانات استلام الطلب' : 'اطلب لحد تاني'} maxWidth="540px">
    <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg mb-4">معاينة للتجربة فقط. مفيش رابط حقيقي ولا طلب أو دفع.</div>
    <div className="flex items-center gap-2 mb-5 text-xs text-text-muted" dir="rtl"><span className={step === 'sender' ? 'text-green font-extrabold' : ''}>1 اختار الطلب</span><ArrowLeft size={12}/><span className={step === 'recipient' ? 'text-green font-extrabold' : ''}>2 بيانات المستلم</span><ArrowLeft size={12}/><span className={step === 'review' ? 'text-green font-extrabold' : ''}>3 راجع وادفع</span></div>
    {step === 'sender' && <>
      <div className="bg-green-dark text-white rounded-2xl p-5 mb-5"><UserRound size={28}/><h3 className="font-extrabold text-xl mt-3 mb-2">أهلك يختاروا مكان الاستلام، وإنت تدفع</h3><p className="text-sm opacity-85 leading-7">اختار الأكل أو الدوا من محل بيخدم قرية أهلك. ابعت رابط خاص للمستلم يكتب عنوانه ورقمه، وبعدها تراجع الطلب بالسعر الحالي.</p></div>
      <div className="border border-green/15 rounded-xl p-4 mb-4"><div className="flex items-center gap-2 font-bold text-sm mb-2"><Link size={17}/>رابط خاص لبيانات التوصيل</div><p className="text-xs text-text-muted leading-6">صالح لمدة 24 ساعة ولمستلم واحد. محدش يقدر يشوف حسابك أو يغيّر منتجاتك أو يدفع من الرابط.</p><div className="flex gap-1 text-[11px] text-green mt-3"><Clock size={14}/> تقدر تلغيه قبل تأكيد الطلب</div></div>
      <Button className="w-full" disabled>إنشاء رابط وإرساله (بعد تفعيل الخدمة)</Button>
      <button type="button" className="w-full text-green font-extrabold text-sm py-4" onClick={() => setStep('recipient')}>جرّب شاشة المستلم في المعاينة</button>
    </>}
    {step === 'recipient' && <>
      <h3 className="font-extrabold mb-2">طلب من حد من أهلك</h3><p className="text-xs text-text-muted leading-6 mb-4">اكتب بيانات استلامك. مش مطلوب منك تدفع أو تكتب بيانات بطاقة. صاحب الطلب هيراجع البيانات ويدفع بنفسه.</p>
      <div className="form-group mb-3"><label htmlFor="familyName">اسم المستلم *</label><input id="familyName" value={recipient.name} maxLength={80} onChange={e=>field('name',e.target.value)}/></div>
      <div className="form-group mb-3"><label htmlFor="familyVillage">قرية التوصيل *</label><input id="familyVillage" value={recipient.village} maxLength={120} placeholder="قرية المستلم" onChange={e=>field('village',e.target.value)}/></div>
      <div className="form-group mb-3"><label htmlFor="familyAddress">العنوان بالتفصيل *</label><textarea id="familyAddress" value={recipient.address} maxLength={300} placeholder="الشارع، رقم البيت، علامة مميزة" onChange={e=>field('address',e.target.value)}/></div>
      <div className="form-group mb-3"><label htmlFor="familyPhone">موبايل المستلم *</label><PhoneInput id="familyPhone" value={recipient.phone} onChange={e=>field('phone',e.target.value)}/></div>
      <label className="flex items-start gap-2 text-xs leading-6 mb-4"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/>موافق إن بيانات التوصيل تتشارك مع صاحب الطلب والمحل والمندوب لإتمام الطلب ده بس.</label>
      {error && <p role="alert" className="text-danger text-xs mb-3">{error}</p>}
      <Button className="w-full" onClick={()=>{if(!validRecipient(recipient)||!consent){setError('راجع الاسم والقرية والعنوان ورقم الموبايل والموافقة.');return;}setError('');setStep('review');}}>احفظ البيانات للمعاينة</Button>
    </>}
    {step === 'review' && <>
      <div className="flex items-center gap-2 text-green font-extrabold mb-3"><Check size={22}/>بيانات المستلم جاهزة للمراجعة</div>
      <div className="rounded-2xl bg-green-50 p-4 text-sm leading-8 mb-4"><strong>{recipient.name}</strong><p>{recipient.village}</p><p>{recipient.address}</p><p dir="ltr" className="text-right">{recipient.phone}</p></div>
      <p className="text-xs leading-7 text-text-muted mb-4">قبل التأكيد: هنراجع إن المحل بيوصل للقرية، وتوفر المنتجات وأسعارها ورسوم التوصيل الحالية. الأدوية المطلوبة بروشتة تفضل خاضعة لمراجعة الصيدلي. مفيش دفع تلقائي.</p>
      <div className="flex gap-2 border rounded-xl p-3 text-xs leading-6 mb-4"><ShieldCheck size={25} className="shrink-0 text-green"/>لو مش عارف المستلم أو البيانات مش صحيحة، ألغي الرابط. إدخال البيانات مش بيعمل طلب.</div>
      <Button className="w-full" disabled>راجع السعر وادفع (بعد تفعيل الخدمة)</Button>
      <button type="button" className="w-full py-3 text-green text-sm font-bold" onClick={()=>setStep('recipient')}>عدّل بيانات المستلم</button>
      <button type="button" className="w-full py-2 text-danger text-xs" onClick={onClose}>إلغاء المعاينة ومسح البيانات</button>
    </>}
  </Modal>;
}
