import { useEffect, useRef, useState } from 'react';
import { reviewsRepo, isSupabaseConfigured } from '@/repositories';
import type { ReviewsPage, ReviewSort, ReviewTarget } from '@/repositories/reviews/supabaseReviewsRepo';
import { ReviewList } from './ReviewList';
import { useAuthStore } from '@/stores/useAuthStore';
export function CatalogReviews({kind,target}:{kind:ReviewTarget;target:number}){
 const [page,setPage]=useState<ReviewsPage|null>(null);const[sort,setSort]=useState<ReviewSort>('newest');const[error,setError]=useState('');const[busy,setBusy]=useState(false);const[more,setMore]=useState(false);const generation=useRef(0);
 const owner=useAuthStore(s=>s.session?.user.id);
 useEffect(()=>{const gen=++generation.current;let alive=true;if(!isSupabaseConfigured)return;reviewsRepo.list(kind,target,sort).then(data=>{if(alive&&generation.current===gen){setPage(data);setMore(data.rows.length===20);setBusy(false);setError('');}}).catch(()=>{if(alive&&generation.current===gen){setPage(null);setError('آراء العملاء مش متاحة دلوقتي.');}});return()=>{alive=false;generation.current=gen+1;};},[kind,target,sort,owner]);
 if(!isSupabaseConfigured)return null;
 if(error)return <p role="status" className="text-xs text-text-muted py-4">{error}</p>;
 if(!page?.count)return null;
 const loadMore=async()=>{if(!page||busy)return;const gen=generation.current;setBusy(true);try{const data=await reviewsRepo.list(kind,target,sort,page.rows.at(-1));if(gen===generation.current){setPage({...data,rows:[...page.rows,...data.rows.filter(row=>!page.rows.some(old=>old.id===row.id))]});setMore(data.rows.length===20);}}catch{if(gen===generation.current)setError('ماقدرناش نحمّل باقي الآراء.');}finally{if(gen===generation.current)setBusy(false);}};
 return <div className="mt-5"><ReviewList sortValue={sort} reviews={page.rows} aggregate={{count:page.count,average:page.average,distribution:page.distribution.map((count,i)=>({stars:5-i,count}))}} onSort={next=>{setPage(null);setSort(next);}} onReport={(id,reason)=>reviewsRepo.report(id,reason)}/>{more&&<button className="p-3 w-full text-green font-bold" disabled={busy} onClick={()=>void loadMore()}>{busy?'بنحمّل…':'آراء أكتر'}</button>}</div>;
}
