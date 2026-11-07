import { CalendarRange, TrendingUp, PackageCheck, Star, Trophy } from 'lucide-react';
import { weeklySummary, type SummaryInput } from './weeklySummary';
export function WeeklySummary({input}:{input:SummaryInput}) {
 const data=weeklySummary(input);
 return <section className="bg-white border border-green/20 rounded-2xl p-4 mb-4" dir="rtl" aria-label="ملخص المحل الأسبوعي">
 <header className="flex gap-2 items-center text-green-dark"><CalendarRange size={22}/><h2 className="font-black text-base m-0">أسبوعك في قريتي</h2><span className="ms-auto text-[10px] bg-gold-light/20 px-2 py-1 rounded-full">كل جمعة</span></header>
 <p className="text-[11px] text-text-muted mt-2 mb-3">من {data.period.start} لحد قبل {data.period.end} · بتوقيت مصر</p>
 {data.state==='unavailable'?<div className="bg-green/5 p-4 rounded-xl"><p className="font-bold text-sm text-green-dark m-0">ملخصك هيظهر لما بيانات طلبات محلك تتربط</p><p className="text-xs text-text-muted leading-relaxed mt-2 mb-0">اللوحة دي لسه معاينة. مش هنحسب من طلبات تجريبية أو من طلبات عميل واحد ونقول إنها مبيعات محلك.</p></div>:<>
 <div className="grid grid-cols-2 gap-2"><Metric icon={<PackageCheck size={18}/>} label="طلب مكتمل" value={String(data.orders)}/><Metric icon={<TrendingUp size={18}/>} label="مقارنة بالأسبوع اللي قبله" value={data.change===null?'مفيش أساس للمقارنة':`${data.change>0?'+':''}${data.change}%`}/></div>
 {data.state==='empty'?<p className="text-sm text-text-muted my-4">مفيش طلبات مكتملة في الفترة دي. أول أسبوع فيه طلبات هيظهر هنا، من غير أرقام متخيلة.</p>:<div className="mt-3 bg-green/5 rounded-xl p-3"><p className="text-xs text-text-muted mb-1"><Trophy size={16} className="inline-block"/> الأكثر طلبًا</p><p className="text-sm text-green-dark font-bold m-0">{data.bestProducts.length?data.bestProducts.map(p=>p.name).join(' و '):'تفاصيل المنتجات مش متاحة'}</p><p className="text-xs text-text-muted mt-3 mb-1">{data.bestDays.length>1?'أيام متعادلة في عدد الطلبات':'أنشط يوم بالطلبات المكتملة'}</p><p className="text-sm text-green-dark font-bold m-0">{data.bestDays.map(d=>new Intl.DateTimeFormat('ar-EG',{weekday:'long',day:'numeric',month:'short',timeZone:'Africa/Cairo'}).format(new Date(d.date+'T12:00:00Z'))).join('، ')}</p></div>}
 <div className="flex gap-2 mt-3 text-sm items-center"><Star size={18} className="text-gold"/><strong>{data.rating===null?'مفيش تقييمات منشورة جديدة':<bdi dir="ltr">{data.rating.toFixed(1)} / 5</bdi>}</strong></div><p className="text-[11px] text-text-muted mt-1 mb-0">{data.ratingCount>0?`${data.ratingCount} تقييم منشور جديد في الفترة دي`:'من غير تقييمات وهمية أو متوسط صفر'} · طلبات ملغية مش محسوبة.</p>
 </>}
 <p className="text-[10px] text-text-muted border-t border-green/10 pt-3 mt-3 mb-0">جوا التطبيق بس. مفيش رسالة واتساب أو تحصيل فلوس.</p>
 </section>;
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="bg-green/5 p-3 rounded-xl min-w-0"><span className="text-green">{icon}</span><strong className="block text-lg text-green-dark mt-2 break-words"><bdi dir="ltr">{value}</bdi></strong><span className="block text-[11px] text-text-muted mt-1">{label}</span></div>}
