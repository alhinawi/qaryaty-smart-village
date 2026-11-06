// ─── Demo data for the provider dashboard preview
//
// ⚠️ SAMPLE DATA. The orders and bookings here are made up to show what the
// dashboard looks like; they are not real customer activity, and edits a
// provider makes in the preview never leave their device.

/** Same wording the customer sees on a pharmacy's menu (ShopMenuModal). */
export const PHARMACY_PACK_NOTE =
  'الأدوية اللي عليها «بروشتة» الصيدلي بيراجع الروشتة قبل التوصيل. الأسعار تقريبية. الصور توضيحية مولدة، مش صورة العبوة الفعلية؛ اعتمد على الاسم والتركيز ومراجعة الصيدلي، مش الصورة.';

/** An incoming shop order as the merchant sees it (preview only). */
export interface DemoIncomingOrder {
  id: string;
  customer: string;
  /** What they asked for, in one line. */
  items: string;
  total: number;
  status: 'new' | 'preparing' | 'done';
  ago: string;
}

/** A booking request as an independent professional sees it (preview only). */
export interface DemoBookingRequest {
  id: string;
  customer: string;
  detail: string;
  day: string;
  time: string;
  status: 'new' | 'accepted' | 'declined';
}

export const DEMO_INCOMING_ORDERS: DemoIncomingOrder[] = [
  {
    id: 'demo-order-1',
    customer: 'أم محمد',
    items: '2 كيلو طماطم، 1 كيلو بطاطس، ربطة جرجير',
    total: 85,
    status: 'new',
    ago: 'من 5 دقايق',
  },
  {
    id: 'demo-order-2',
    customer: 'الحاج محمود',
    items: 'كرتونة بيض، 2 كيلو سكر، لتر زيت',
    total: 320,
    status: 'preparing',
    ago: 'من 25 دقيقة',
  },
  {
    id: 'demo-order-3',
    customer: 'أستاذة سميرة',
    items: '3 عيش بلدي، 2 فينو',
    total: 25,
    status: 'done',
    ago: 'من ساعة',
  },
];

export const DEMO_BOOKING_REQUESTS: DemoBookingRequest[] = [
  {
    id: 'demo-booking-1',
    customer: 'الحاجة فاطمة',
    detail: 'الحنفية بتنقط والسيفون محتاج يتظبط',
    day: 'بكره',
    time: '10:00 ص',
    status: 'new',
  },
  {
    id: 'demo-booking-2',
    customer: 'عم رمضان',
    detail: 'معاينة مواسير الحمّام قبل التشطيب',
    day: 'الخميس',
    time: '5:00 م',
    status: 'accepted',
  },
  {
    id: 'demo-booking-3',
    customer: 'أم يوسف',
    detail: 'تغيير محبس المطبخ',
    day: 'الجمعة',
    time: '12:00 م',
    status: 'new',
  },
];

/** Days of the week as people say them, Saturday first. */
export const WEEK_DAYS = ['السبت', 'الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة'] as const;

export const DEFAULT_WORKING_DAYS = ['السبت', 'الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس'];
