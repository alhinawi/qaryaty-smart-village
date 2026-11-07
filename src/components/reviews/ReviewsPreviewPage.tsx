import { useState } from 'react';
import { Link } from 'react-router';
import { ReviewList } from './ReviewList';
import type { PublicReview } from './reviewModel';
const examples: PublicReview[] = [
{id:'sample-1',authorLabel:'عميل تجريبي ١',stars:5,text:'الطلب وصل مرتب وفي المعاد. التعامل كان محترم وهكرر التجربة.',createdAt:'2026-11-06T18:00:00+02:00',completedOrder:true},
{id:'sample-2',authorLabel:'عميل تجريبي ٢',stars:4,text:'الخدمة كويسة، بس ياريت تحديث المعاد لو فيه تأخير.',createdAt:'2026-11-05T14:00:00+02:00',completedOrder:true},
{id:'sample-3',authorLabel:'عميل تجريبي ٣',stars:3,text:'الطلب كان ناقص صنف. اتواصلت مع المحل واتحل، لكن محتاجين يراجعوا الطلب قبل ما يخرج.',createdAt:'2026-11-04T16:00:00+02:00',completedOrder:true},
];
export default function ReviewsPreviewPage(){
 const [empty,setEmpty]=useState(false);
 return <main className="max-w-xl mx-auto px-4 pt-5 pb-28" dir="rtl"><Link to="/" className="text-sm text-green font-bold">الرئيسية</Link><p className="bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl p-3 text-xs leading-6 my-4">معاينة تصميم فقط. كل الأسماء والآراء هنا خيالية. مفيش تقييم أو بلاغ هيتحفظ أو يتنشر.</p><h1 className="text-2xl font-black mb-1">محل توضيحي</h1><p className="text-sm text-text-muted mb-5">مكان لآراء العملاء تحت تفاصيل كل محل أو مزود خدمة</p><div className="flex gap-2 mb-4">{[false,true].map(value=><button key={String(value)} onClick={()=>setEmpty(value)} className={`rounded-full px-4 py-2 text-sm font-bold border ${empty===value?'bg-green text-white border-green':'border-green/20 bg-white text-green'}`}>{value?'من غير تقييمات':'شكل الآراء'}</button>)}</div><ReviewList key={String(empty)} reviews={empty?[]:examples} preview/></main>;
}
