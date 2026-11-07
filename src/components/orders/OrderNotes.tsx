/** Show the customer's note in full, before accepting/preparing an order. */
export function OrderNotes({notes}:{notes?:string|null}){
 if(!notes?.trim())return null;
 return <aside aria-label="ملاحظات العميل" className="rounded-xl border border-gold/60 bg-amber-50 text-[#704b00] p-3 my-3"><p className="text-xs font-black mb-1">ملاحظات العميل</p><p className="text-sm font-bold leading-7 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{notes.trim()}</p></aside>;
}
