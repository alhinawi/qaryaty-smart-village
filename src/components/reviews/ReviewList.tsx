import { useState } from 'react';
import { Flag, ShieldCheck, Star } from 'lucide-react';
import { reviewSummary, sortedReviews, type PublicReview } from './reviewModel';
export function ReviewList({ reviews, preview = false, aggregate, onSort, onReport, sortValue }: { reviews: PublicReview[]; preview?: boolean; sortValue?:'newest'|'highest'|'lowest'; aggregate?: {count:number;average:number|null;distribution:{stars:number;count:number}[]}; onSort?:(sort:'newest'|'highest'|'lowest')=>void; onReport?:(id:string,reason:string)=>Promise<void> }) {
  const [sort,setSort] = useState<'newest'|'highest'|'lowest'>(sortValue??'newest');
  const [report,setReport] = useState<string|null>(null);
  const [reason,setReason] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const summary = aggregate ?? reviewSummary(reviews);
  return <section className="bg-white rounded-3xl border border-green/15 p-5" aria-label="آراء العملاء" dir="rtl">
    <div className="flex items-center justify-between gap-2 mb-2"><h2 className="text-xl font-black text-green-dark">آراء العملاء</h2><span className="text-sm text-text-muted">{summary.count} تقييم</span></div>
    <p className="text-xs leading-6 text-text-muted mb-4">{preview ? 'تقييمات خيالية لتجربة التصميم. شارة الطلب المكتمل هنا مجرد نموذج.' : 'من عملاء أكملوا طلبهم. الرأي بيعبر عن تجربة صاحبه، مش ضمان لجودة الخدمة.'}</p>
    {summary.count === 0 ? <div className="text-center py-9 bg-green/5 rounded-2xl"><Star className="mx-auto text-green mb-3" size={30}/><h3 className="font-extrabold mb-2">لسه مفيش تقييمات</h3><p className="text-sm text-text-muted leading-7">بعد ما طلبك يكتمل، تقدر تكتب رأيك من صفحة طلباتي.</p></div> : <>
      <div className="flex items-center gap-6 bg-[#fff8df] border border-gold/30 rounded-2xl p-4 mb-5">
        <div className="text-center shrink-0"><p className="text-4xl font-black text-green-dark">{summary.average?.toFixed(1)}</p><Star className="mx-auto text-gold my-1" size={20} fill="currentColor" aria-hidden="true"/><p className="text-xs text-text-muted">من 5</p></div>
        <div className="flex-1 space-y-1.5">{summary.distribution.map(row=><div key={row.stars} className="flex gap-2 items-center text-xs text-text-muted"><span>{row.stars}</span><div className="h-1.5 flex-1 rounded-full bg-green/10 overflow-hidden"><div className="h-full rounded-full bg-green" style={{width:`${row.count/summary.count*100}%`}}/></div><span className="w-3">{row.count}</span></div>)}</div>
      </div>
      <label className="flex items-center justify-between gap-3 mb-2 text-sm font-bold">ترتيب الآراء<select className="rounded-xl border border-green/20 p-2 text-sm bg-white" value={sort} onChange={e=>{setSort(e.target.value as typeof sort);onSort?.(e.target.value as typeof sort);}}><option value="newest">الأحدث</option><option value="highest">الأعلى تقييمًا</option><option value="lowest">الأقل تقييمًا</option></select></label>
      <div className="divide-y divide-green/10">{(onSort ? reviews : sortedReviews(reviews,sort)).map(review=><article key={review.id} className="py-5">
        <div className="flex justify-between gap-2 items-center"><h3 className="font-extrabold">{review.authorLabel}</h3><span className="text-gold font-bold" aria-label={`${review.stars} من 5 نجوم`}>{'★'.repeat(review.stars)}<span className="text-gray-200">{'★'.repeat(5-review.stars)}</span></span></div>
        <div className="flex flex-wrap gap-2 items-center text-xs mt-2"><span className="inline-flex items-center gap-1 bg-green/5 text-green rounded-full px-2 py-1"><ShieldCheck size={13}/>{preview ? 'نموذج: طلب مكتمل' : 'طلب مكتمل'}</span><time className="text-text-muted" dateTime={review.createdAt}>{new Intl.DateTimeFormat('ar-EG',{day:'numeric',month:'long',year:'numeric',timeZone:'Africa/Cairo'}).format(new Date(review.createdAt))}</time></div>
        {review.text && <p className="text-sm leading-7 mt-3 break-words">{review.text}</p>}
        <button type="button" className="inline-flex gap-1.5 items-center text-xs text-text-muted mt-3 py-1" onClick={()=>{setReport(review.id);setReason('');setNotice('');}}><Flag size={12}/>بلّغ عن التقييم</button>
        {report===review.id && <form className="bg-gray-50 p-3 rounded-xl mt-2" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);try{if(preview)setNotice('معاينة فقط: البلاغ لم يُرسل.');else if(onReport){await onReport(review.id,reason);setNotice('وصل البلاغ للمراجعة. شكرًا لتنبيهك.');}setReport(null);}catch{setNotice('البلاغ ما اتبعتش. سجّل دخولك أو جرّب تاني.');}finally{setBusy(false);}}}><label className="block text-sm mb-2">سبب البلاغ<select required value={reason} onChange={e=>setReason(e.target.value)} className="block mt-2 p-2 rounded-lg w-full border border-green/20 bg-white"><option value="">اختار السبب</option><option value="abuse">إساءة أو ألفاظ غير مناسبة</option><option value="personal">معلومات شخصية</option><option value="spam">إعلان أو تقييم غير متعلق بالخدمة</option><option value="fake">تقييم مزيف</option></select></label><div className="flex gap-3 mt-3"><button disabled={busy||(!preview&&!onReport)||!reason} className="bg-green text-white text-xs rounded-lg px-3 py-2 disabled:opacity-40">{busy?'جاري الإرسال…':preview?'جرّب إرسال البلاغ':'إرسال البلاغ'}</button><button type="button" className="text-xs" onClick={()=>setReport(null)}>إلغاء</button></div></form>}
      </article>)}</div>
    </>}
    {notice && <p role="status" className="p-3 bg-amber-50 text-amber-900 text-sm rounded-xl mt-3">{notice}</p>}
  </section>;
}
