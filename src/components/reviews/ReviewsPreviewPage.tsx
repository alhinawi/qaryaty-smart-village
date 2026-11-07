import { useEffect,useState } from 'react';
import { loadDemoModeSetting } from '@/repositories';
import { Link } from 'react-router';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { ReviewList } from './ReviewList';
import type { PublicReview } from './reviewModel';
const examples: PublicReview[] = [
{id:'sample-1',authorLabel:'أحمد',stars:5,text:'الطلب وصل مرتب وفي المعاد. التعامل كان محترم وهكرر التجربة.',createdAt:'2026-11-06T18:00:00+02:00',completedOrder:true},
{id:'sample-2',authorLabel:'منى',stars:4,text:'الخدمة كويسة، بس ياريت تحديث المعاد لو فيه تأخير.',createdAt:'2026-11-05T14:00:00+02:00',completedOrder:true},
{id:'sample-3',authorLabel:'محمود',stars:3,text:'الطلب كان ناقص صنف. اتواصلت مع المحل واتحل، لكن محتاجين يراجعوا الطلب قبل ما يخرج.',createdAt:'2026-11-04T16:00:00+02:00',completedOrder:true},
];
export default function ReviewsPreviewPage(){
 const [empty,setEmpty]=useState(false);
 const demo=useTrackingDemoMode();
 useEffect(()=>{void loadDemoModeSetting().catch(()=>{});},[]);
 if(!demo)return null;
 return <main className="max-w-xl mx-auto px-4 pt-5 pb-28" dir="rtl"><Link to="/" className="text-sm text-green font-bold">الرئيسية</Link><h1 className="text-2xl font-black mb-1">فرن الأصيل</h1><p className="text-sm text-text-muted mb-5">آراء العملاء عن تجربتهم</p><div className="flex gap-2 mb-4">{[false,true].map(value=><button key={String(value)} onClick={()=>setEmpty(value)} className={`rounded-full px-4 py-2 text-sm font-bold border ${empty===value?'bg-green text-white border-green':'border-green/20 bg-white text-green'}`}>{value?'من غير تقييمات':'شكل الآراء'}</button>)}</div><ReviewList key={String(empty)} reviews={empty?[]:examples} preview/></main>;
}
