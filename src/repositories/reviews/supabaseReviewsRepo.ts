import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicReview } from '@/components/reviews/reviewModel';
export type ReviewSort='newest'|'highest'|'lowest';
export type ReviewTarget='shop'|'provider'|'service';
export interface ReviewsPage {rows:PublicReview[];count:number;average:number|null;distribution:number[]}
export interface ModerationReview {id:string;target_kind:ReviewTarget;target_id:number;author_label:string;stars:number;body:string;created_at:string;status:string;reports_count:number;report_reasons:{reason:string;created_at:string}[]}
export function createReviewsRepo(getClient:()=>Promise<SupabaseClient>){
 async function rpc<T>(name:string,args?:Record<string,unknown>):Promise<T>{const c=await getClient();const{data,error}=await c.rpc(name,args);if(error)throw new Error('ماقدرناش نكمل العملية. جرّب تاني، والتقييم لازم يكون لطلب مكتمل من حسابك.');return data as T;}
 return {
  list:(kind:ReviewTarget,target:number,sort:ReviewSort='newest',cursor?:PublicReview)=>rpc<ReviewsPage>('list_public_reviews',{p_kind:kind,p_target:target,p_sort:sort,p_cursor_time:cursor?.createdAt??null,p_cursor_id:cursor?.id??null,p_cursor_stars:cursor?.stars??null}),
  mine:()=>rpc<{order_id:string;status:string}[]>('my_order_reviews'),
  submit:(orderId:string,stars:number,text:string,name:string)=>rpc<string>('submit_review',{p_order:orderId,p_stars:stars,p_body:text,p_name:name}),
  report:(id:string,reason:string)=>rpc<void>('report_review',{p_review:id,p_reason:reason}),
  queue:()=>rpc<ModerationReview[]>('review_moderation_queue'),
  moderate:(id:string,publish:boolean,reason:string)=>rpc<void>('moderate_review',{p_review:id,p_publish:publish,p_reason:reason}),
 };
}
