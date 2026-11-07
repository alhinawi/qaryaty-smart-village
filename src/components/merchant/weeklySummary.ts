export interface SummaryOrder { id:string;shopId:number;status:'completed'|'cancelled'|'open';completedAt:string|null;demo:boolean;items:{productId:string;name:string;quantity:number}[] }
export interface SummaryReview { id:string;orderId:string;shopId:number;rating:number;createdAt:string;published:boolean;demo:boolean }
export interface SummaryInput { shopId:number;orders:SummaryOrder[];reviews:SummaryReview[];complete:boolean;demoEnabled:boolean;now:Date }
export function cairoDay(date:Date): string {return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
/** Latest completed Friday-to-Friday week. Friday itself is delivery day. */
export function weeklyPeriod(now:Date) {
  const today=new Date(cairoDay(now)+'T00:00:00Z');const daysSinceFriday=(today.getUTCDay()+2)%7;
  const end=new Date(today.getTime()-daysSinceFriday*86400000);const start=new Date(end.getTime()-7*86400000);const previousStart=new Date(start.getTime()-7*86400000);
  return {start:cairoDayAtUtc(start),end:cairoDayAtUtc(end),previousStart:cairoDayAtUtc(previousStart)};
}
function cairoDayAtUtc(date:Date){return date.toISOString().slice(0,10);}
export function weeklySummary(input:SummaryInput) {
 const period=weeklyPeriod(input.now);if(!input.complete)return {state:'unavailable' as const,period};
 const seen=new Set<string>();const orders=input.orders.filter(order=>{if(seen.has(order.id)||order.shopId!==input.shopId||order.status!=='completed'||!order.completedAt||(!input.demoEnabled&&order.demo)||!Number.isFinite(new Date(order.completedAt).getTime())||new Date(order.completedAt)>input.now)return false;seen.add(order.id);return true;});
 const current=orders.filter(o=>{const day=cairoDay(new Date(o.completedAt!));return day>=period.start&&day<period.end;});
 const previous=orders.filter(o=>{const day=cairoDay(new Date(o.completedAt!));return day>=period.previousStart&&day<period.start;});
 const products=new Map<string,{id:string;name:string;quantity:number}>();const days=new Map<string,number>();
 for(const order of current){const day=cairoDay(new Date(order.completedAt!));days.set(day,(days.get(day)||0)+1);for(const item of order.items.filter((item,index,items)=>items.findIndex(other=>other.productId===item.productId)===index)){if(!item.productId||!item.name.trim()||!Number.isFinite(item.quantity)||item.quantity<=0)continue;const old=products.get(item.productId);products.set(item.productId,{id:item.productId,name:item.name,quantity:(old?.quantity||0)+1});}}
 const bestProducts=[...products.values()].sort((a,b)=>b.quantity-a.quantity||a.id.localeCompare(b.id));const bestDays=[...days].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const reviewSeen=new Set<string>();const ratings=input.reviews.filter(r=>{const day=Number.isFinite(new Date(r.createdAt).getTime())?cairoDay(new Date(r.createdAt)):'';if(reviewSeen.has(r.orderId)||r.shopId!==input.shopId||!r.published||(!input.demoEnabled&&r.demo)||r.rating<1||r.rating>5||!Number.isInteger(r.rating)||!orders.some(o=>o.id===r.orderId)||day<period.start||day>=period.end)return false;reviewSeen.add(r.orderId);return true;});
 return {state:current.length?'ready' as const:'empty' as const,period,orders:current.length,previousOrders:previous.length,change:previous.length?Math.round((current.length-previous.length)/previous.length*100):null,bestProducts:bestProducts.filter(p=>p.quantity===bestProducts[0]?.quantity),bestDays:bestDays.filter(d=>d[1]===bestDays[0]?.[1]).map(d=>({date:d[0],orders:d[1]})),rating:ratings.length?ratings.reduce((s,r)=>s+r.rating,0)/ratings.length:null,ratingCount:ratings.length};
}
