/** Notification has a bounded note; the card keeps the complete original. */
export function notificationOrderNote(notes?:string|null){const text=notes?.trim();if(!text)return '';return `ملاحظات العميل: ${text.slice(0,1000)}${text.length>1000?'\nباقي الملاحظات في تفاصيل الطلب.':''}\n`;}
