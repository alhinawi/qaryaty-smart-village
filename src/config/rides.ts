// ─── شير مواصلة: labels, the safety note and the small rules the pages share
import { matchesSearch } from '@/utils/arabicSearch';
import { shortVillage } from '@/config/jobs';
import type {
  Ride,
  RideKind,
  RideReportReason,
  RideRequestStatus,
  RideRiders,
  RideSchedule,
} from '@/repositories/rides/types';

/** A repeating trip shows this long, then the owner can renew it */
export const RIDE_DAYS = 30;
/** Renew opens this many days before the post ends */
export const RIDE_RENEW_WINDOW_DAYS = 7;
/** A one-off trip can be up to this many days ahead */
export const RIDE_MAX_DAYS_AHEAD = 30;
/** The highest token price per seat for a car, and the highest share for a taxi */
export const RIDE_CAR_MAX_PRICE = 100;
export const RIDE_TAXI_MAX_PRICE = 300;

export const RIDE_KINDS: { id: RideKind; label: string; icon: string; hint: string }[] = [
  { id: 'taxi', label: 'نتشارك تاكسي', icon: '🚕', hint: 'محتاج حد أو اتنين يقسموا معاك الأجرة' },
  { id: 'car', label: 'عندي عربية', icon: '🚗', hint: 'رايح بعربيتك وعندك كراسي فاضية بسعر رمزي' },
];

export function rideKindLabel(kind: RideKind): string {
  return RIDE_KINDS.find((k) => k.id === kind)?.label ?? '';
}
export function rideKindIcon(kind: RideKind): string {
  return RIDE_KINDS.find((k) => k.id === kind)?.icon ?? '';
}

/** 0 = Sunday, like Date.getDay() */
export const WEEKDAYS = ['الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
/** أيام الشغل والدراسة in Egypt: Sunday to Thursday */
export const WORK_DAYS = [0, 1, 2, 3, 4];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export const RIDE_SCHEDULES: { id: RideSchedule; label: string }[] = [
  { id: 'daily', label: 'كل يوم' },
  { id: 'weekdays', label: 'من الحد للخميس' },
  { id: 'days', label: 'أيام معينة' },
  { id: 'once', label: 'مرة واحدة' },
];

export const RIDE_RIDERS: { id: RideRiders; label: string; icon: string }[] = [
  { id: 'any', label: 'أي حد', icon: '👥' },
  { id: 'women', label: 'ستات بس', icon: '🧕' },
  { id: 'men', label: 'رجالة بس', icon: '👨' },
];

export function ridersLabel(riders: RideRiders): string {
  return RIDE_RIDERS.find((r) => r.id === riders)?.label ?? '';
}

export const RIDE_REPORT_REASONS: { id: RideReportReason; label: string }[] = [
  { id: 'commercial', label: 'شغل تاكسي بأجرة، مش سعر رمزي' },
  { id: 'asks_money', label: 'بيطلب فلوس مقدم' },
  { id: 'unsafe', label: 'تصرف مش آمن أو مضايقة' },
  { id: 'fake', label: 'المشوار مش حقيقي' },
  { id: 'other', label: 'حاجة تانية' },
];

export const RIDE_REQUEST_STATUS: Record<RideRequestStatus, string> = {
  pending: 'مستني الرد',
  accepted: 'اتقبل',
  declined: 'مااتقبلش',
  cancelled: 'اتلغى',
};

export const RIDE_SAFETY_POINTS = [
  'قول لحد من أهلك إنت رايح فين ومع مين، وابعتلهم رقم العربية.',
  'اتقابلوا في مكان عام زي الموقف أو قدام الجامع.',
  'ماتدفعش أي فلوس مقدم، الحساب في المشوار نفسه.',
  'العربيات بسعر رمزي بس، مش شغل تاكسي بأجرة.',
];

/** Words that bring the rides banner up in the home search */
export const RIDE_SEARCH_WORDS = [
  'مواصلات',
  'مواصلة',
  'شير',
  'توصيلة',
  'توصيل',
  'عربية',
  'تاكسي',
  'ميكروباص',
  'مشوار',
  'ركوبة',
  'اوبر',
];

export const TIME_WINDOWS: { id: string; label: string; from: number; to: number }[] = [
  { id: 'early', label: 'بدري (قبل 7)', from: 0, to: 7 * 60 },
  { id: 'morning', label: 'الصبح (7 – 10)', from: 7 * 60, to: 10 * 60 },
  { id: 'noon', label: 'الضهر (10 – 2)', from: 10 * 60, to: 14 * 60 },
  { id: 'afternoon', label: 'العصر (2 – 6)', from: 14 * 60, to: 18 * 60 },
  { id: 'evening', label: 'بالليل (بعد 6)', from: 18 * 60, to: 24 * 60 },
];

const DAY = 24 * 60 * 60 * 1000;

function minutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** "07:30" → "7:30 الصبح", "15:00" → "3 العصر" */
export function timeLabel(time: string): string {
  if (!time) return '';
  const total = minutes(time);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const part = h < 5 ? 'بالليل' : h < 12 ? 'الصبح' : h < 15 ? 'الضهر' : h < 18 ? 'العصر' : 'بالليل';
  const h12 = h % 12 || 12;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${part}`;
}

/** The date in Cairo as YYYY-MM-DD */
export function cairoDate(at: number = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date(at));
}

function dayOf(iso: string): number {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

/** "2026-11-07" → "بكرة (السبت 7 نوفمبر)" */
export function dateLabel(iso: string, now = Date.now()): string {
  if (!iso) return '';
  const [, mo, d] = iso.split('-').map(Number);
  const full = `${WEEKDAYS[dayOf(iso)]} ${d} ${MONTHS[mo - 1]}`;
  const today = cairoDate(now);
  if (iso === today) return `النهارده (${full})`;
  if (iso === cairoDate(now + DAY)) return `بكرة (${full})`;
  return full;
}

export function scheduleLabel(ride: Pick<Ride, 'schedule' | 'days' | 'rideDate'>, now = Date.now()): string {
  switch (ride.schedule) {
    case 'daily':
      return 'كل يوم';
    case 'weekdays':
      return 'من الحد للخميس';
    case 'days':
      return [...ride.days].sort((a, b) => a - b).map((d) => WEEKDAYS[d]).join(' و');
    case 'once':
      return dateLabel(ride.rideDate, now);
  }
}

export function seatsLeft(ride: Pick<Ride, 'seats' | 'seatsTaken'>): number {
  return Math.max(0, ride.seats - ride.seatsTaken);
}

function count(n: number, one: string, two: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  return `${n} ${many}`;
}

/** "كرسيين فاضيين" for a car, "عايز اتنين كمان" for a taxi, "اكتمل" when full */
export function seatsLabel(ride: Pick<Ride, 'kind' | 'seats' | 'seatsTaken'>): string {
  const left = seatsLeft(ride);
  if (left === 0) return 'اكتمل';
  return ride.kind === 'car'
    ? count(left, 'كرسي فاضي واحد', 'كرسيين فاضيين', 'كراسي فاضية')
    : `عايز ${count(left, 'واحد', 'اتنين', 'أشخاص')} كمان`;
}

export function priceLabel(ride: Pick<Ride, 'kind' | 'price'>): string {
  if (ride.kind === 'car') return ride.price ? `${ride.price} جنيه للكرسي` : 'ببلاش';
  return ride.price ? `حوالي ${ride.price} جنيه للفرد` : 'الأجرة بالتساوي';
}

/** "منية سندوب ← المنصورة" (the arrow points the way the eye reads in Arabic) */
export function routeLabel(ride: Pick<Ride, 'fromVillage' | 'toPlace'>): string {
  return `${shortVillage(ride.fromVillage)} ← ${ride.toPlace}`;
}

export function isRideLive(ride: Pick<Ride, 'status' | 'expiresAt'>, now = Date.now()): boolean {
  return ride.status === 'active' && new Date(ride.expiresAt).getTime() > now;
}

export function rideDaysLeft(ride: Pick<Ride, 'expiresAt'>, now = Date.now()): number {
  return Math.max(0, Math.floor((new Date(ride.expiresAt).getTime() - now) / DAY));
}

export function canRenewRide(ride: Pick<Ride, 'status' | 'schedule' | 'expiresAt'>, now = Date.now()): boolean {
  if (ride.status === 'hidden' || ride.schedule === 'once') return false;
  return new Date(ride.expiresAt).getTime() - now <= RIDE_RENEW_WINDOW_DAYS * DAY;
}

/** What the owner reads on their own post */
export function rideStatusLabel(ride: Pick<Ride, 'status' | 'expiresAt'>, now = Date.now()): string {
  if (ride.status === 'hidden') return 'مستخبي بسبب بلاغات';
  if (new Date(ride.expiresAt).getTime() <= now) return 'خلصت مدته';
  if (ride.status === 'paused') return 'متوقف';
  return 'ظاهر';
}

/** Does the trip run on this date (YYYY-MM-DD, Cairo)? */
export function runsOn(ride: Pick<Ride, 'schedule' | 'days' | 'rideDate'>, iso: string): boolean {
  const day = dayOf(iso);
  switch (ride.schedule) {
    case 'daily':
      return true;
    case 'weekdays':
      return WORK_DAYS.includes(day);
    case 'days':
      return ride.days.includes(day);
    case 'once':
      return ride.rideDate === iso;
  }
}

export interface RideFilters {
  query: string;
  village: string;
  kind: RideKind | '';
  window: string;
  /** 'women' shows ستات بس posts only */
  womenOnly: boolean;
  /** Only the trips that run today */
  today: boolean;
}

export const EMPTY_RIDE_FILTERS: RideFilters = { query: '', village: '', kind: '', window: '', womenOnly: false, today: false };

export function filterRides(rides: Ride[], f: RideFilters, now = Date.now()): Ride[] {
  const win = TIME_WINDOWS.find((w) => w.id === f.window);
  const today = cairoDate(now);
  return rides.filter((ride) => {
    if (f.village && ride.fromVillage !== f.village) return false;
    if (f.kind && ride.kind !== f.kind) return false;
    if (f.womenOnly && ride.riders !== 'women') return false;
    if (f.today && !runsOn(ride, today)) return false;
    if (win) {
      const m = minutes(ride.departTime);
      if (m < win.from || m >= win.to) return false;
    }
    return matchesSearch(f.query, [ride.toPlace, ride.fromVillage, ride.notes, ride.carType]);
  });
}

export function hasRideFilters(f: RideFilters): boolean {
  return f.query.trim() !== '' || f.village !== '' || f.kind !== '' || f.window !== '' || f.womenOnly || f.today;
}

/** The villages that have trips, for the filter, most trips first */
export function rideVillages(rides: Ride[]): string[] {
  const counts = new Map<string, number>();
  for (const ride of rides) counts.set(ride.fromVillage, (counts.get(ride.fromVillage) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ar')).map(([v]) => v);
}

export function ridePhoneLink(phone: string): string {
  return `tel:+2${phone}`;
}

/** WhatsApp to the poster, about this trip */
export function rideWhatsappLink(ride: Pick<Ride, 'phone' | 'fromVillage' | 'toPlace' | 'departTime'>): string {
  const text = `السلام عليكم، شفت مشوارك من ${shortVillage(ride.fromVillage)} لـ ${ride.toPlace} الساعة ${timeLabel(ride.departTime)} على قريتي، وعايز أشير معاك.`;
  return `https://wa.me/2${ride.phone}?text=${encodeURIComponent(text)}`;
}

/** WhatsApp from the poster to someone who asked to join */
export function riderWhatsappLink(phone: string, ride: Pick<Ride, 'fromVillage' | 'toPlace'>): string {
  const text = `السلام عليكم، بخصوص طلبك على قريتي تنضم لمشوار ${shortVillage(ride.fromVillage)} لـ ${ride.toPlace}.`;
  return `https://wa.me/2${phone}?text=${encodeURIComponent(text)}`;
}
