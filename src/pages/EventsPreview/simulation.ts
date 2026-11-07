import { useAuthStore } from '@/stores/useAuthStore';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isTrackingDemoMode } from '@/config/demoMode';
import { validEventDraft, type EventDraft, type EventService } from './model';
/** Sole provenance marker, kept out of real repositories, checkout and accounts. */
export const EVENT_SIMULATION_SOURCE = 'qaryati_event_simulation_v1';
export const EVENT_PACKAGES: {service:EventService;name:string;package:string;price:number;unit:'guest'|'event';includes:string}[] = [
 {service:'catering',name:'مطبخ أم ياسين',package:'أكل بيتي للمناسبات',price:145,unit:'guest',includes:'ربع فرخة ورز وخضار وسلطة لكل ضيف؛ من غير مشروبات'},
 {service:'tent',name:'فراشة أولاد سالم',package:'صوان وتجهيز مكان',price:3500,unit:'event',includes:'صوان حتى150ضيف، إضاءة وتجهيز وفك؛ المكان يوفّره صاحب المناسبة'},
 {service:'chairs',name:'تجهيزات أبو فارس',package:'قعدة ضيوفك',price:25,unit:'guest',includes:'كرسي لكل ضيف وترابيزة لكل8ضيوف بغطاء؛ تجهيز وفك'},
 {service:'photo',name:'عدسة يوسف',package:'تصوير3ساعات',price:2200,unit:'event',includes:'صور رقمية للمناسبة؛ الفيديو والطباعة مش ضمن الباقة'},
 {service:'delivery',name:'نقل الحاج عادل',package:'نقل التجهيزات داخل القرية',price:650,unit:'event',includes:'مشوار تجهيز ومشوار فك داخل نفس القرية؛ أدوار أرضية'},
];
export interface EventSimulationBooking {id:string;source:typeof EVENT_SIMULATION_SOURCE;scope:string;createdAt:string;reference:string;status:'confirmed';draft:EventDraft;total:number;lines:{service:EventService;name:string;amount:number}[]}
export function simulatedQuote(draft:EventDraft){
 if(!Number.isInteger(draft.guests)||draft.guests<1||draft.guests>150)return null;
 const lines=draft.services.map(service=>{const row=EVENT_PACKAGES.find(p=>p.service===service);return row?{service,name:row.name,amount:row.price*(row.unit==='guest'?draft.guests:1)}:null;});
 if(!lines.length||lines.some(row=>row===null))return null;
 const valid=lines.filter((row):row is NonNullable<typeof row>=>row!==null);return {lines:valid,total:valid.reduce((sum,row)=>sum+row.amount,0)};
}
interface State{bookings:EventSimulationBooking[];confirm:(draft:EventDraft)=>EventSimulationBooking|null}
export const useEventSimulationStore=create<State>()(persist((set,get)=>({bookings:[],confirm(draft){if(!isTrackingDemoMode()||!validEventDraft(draft))return null;const quote=simulatedQuote(draft);if(!quote)return null;const scope=useAuthStore.getState().session?.user.id??'guest';const existing=get().bookings.find(b=>b.scope===scope&&JSON.stringify(b.draft)===JSON.stringify(draft));if(existing)return existing;const id=crypto.randomUUID();const row:EventSimulationBooking={id,source:EVENT_SIMULATION_SOURCE,scope,createdAt:new Date().toISOString(),reference:'EV-'+id.slice(0,8).toUpperCase(),status:'confirmed',draft:structuredClone(draft),...quote};set({bookings:[row,...get().bookings].slice(0,30)});return row;}}),{name:'qaryati_event_simulation_v1',storage:createJSONStorage(()=>({getItem:(key:string)=>{try{return sessionStorage.getItem(key);}catch{return null;}},setItem:(key:string,value:string)=>{try{sessionStorage.setItem(key,value);}catch{/* In-memory only when storage unavailable. */}},removeItem:(key:string)=>{try{sessionStorage.removeItem(key);}catch{/* No durable data. */}}})),partialize:state=>({bookings:state.bookings})}));
