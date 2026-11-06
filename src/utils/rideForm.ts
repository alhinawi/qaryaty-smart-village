// ─── The "نزّل مشوار" form: checks before it goes to Supabase
// The database checks the same limits again (see the rides migration).
import { z } from 'zod';
import { RIDE_CAR_MAX_PRICE, RIDE_MAX_DAYS_AHEAD, RIDE_TAXI_MAX_PRICE, cairoDate } from '@/config/rides';
import { egyptianPhoneSchema } from './validators';

const squish = (value: unknown) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value);
const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : value);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = 24 * 60 * 60 * 1000;

export function rideFormSchema(now = Date.now()) {
  return z
    .object({
      kind: z.enum(['taxi', 'car'], { message: 'اختار نوع المشوار' }),
      fromVillage: z.preprocess(
        squish,
        z.string().min(2, { message: 'اختار القرية اللي هتطلع منها' }).max(120, { message: 'اسم القرية طويل أوي' })
      ),
      toPlace: z.preprocess(
        squish,
        z.string().min(2, { message: 'اكتب رايح فين (مثلًا: المنصورة)' }).max(80, { message: 'المكان طويل أوي' })
      ),
      departTime: z.string().regex(TIME, { message: 'اختار ميعاد الطلوع' }),
      returnTime: z.string().refine((v) => v === '' || TIME.test(v), { message: 'ميعاد الرجوع مش مظبوط' }),
      schedule: z.enum(['daily', 'weekdays', 'days', 'once'], { message: 'اختار الأيام' }),
      days: z.array(z.number().int().min(0).max(6)),
      rideDate: z.string(),
      seats: z.number().int().min(1, { message: 'اختار العدد' }).max(6),
      price: z.number().int().min(0, { message: 'السعر مش مظبوط' }).nullable(),
      carType: z.preprocess(squish, z.string().max(40, { message: 'نوع العربية مايزيدش عن 40 حرف' })),
      notes: z.preprocess(trim, z.string().max(500, { message: 'الملاحظات ماتزيدش عن 500 حرف' })),
      riders: z.enum(['any', 'women', 'men']),
      phone: egyptianPhoneSchema,
      whatsapp: z.boolean(),
    })
    .superRefine((v, ctx) => {
      if (v.schedule === 'days' && (v.days.length === 0 || v.days.length > 6)) {
        ctx.addIssue({ code: 'custom', path: ['days'], message: v.days.length ? 'لو كل الأيام اختار «كل يوم»' : 'اختار يوم واحد على الأقل' });
      }
      if (v.schedule === 'once') {
        const today = cairoDate(now);
        const last = cairoDate(now + RIDE_MAX_DAYS_AHEAD * DAY);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v.rideDate) || v.rideDate < today || v.rideDate > last) {
          ctx.addIssue({ code: 'custom', path: ['rideDate'], message: 'اختار يوم من النهارده لحد 30 يوم قدام' });
        }
      }
      if (v.kind === 'taxi' && v.seats > 3) {
        ctx.addIssue({ code: 'custom', path: ['seats'], message: 'التاكسي ياخد 3 معاك بالكتير' });
      }
      if (v.kind === 'car') {
        if (v.price === null) {
          ctx.addIssue({ code: 'custom', path: ['price'], message: 'اكتب السعر الرمزي للكرسي، أو 0 لو ببلاش' });
        } else if (v.price > RIDE_CAR_MAX_PRICE) {
          ctx.addIssue({
            code: 'custom',
            path: ['price'],
            message: `السعر الرمزي مايزيدش عن ${RIDE_CAR_MAX_PRICE} جنيه للكرسي`,
          });
        }
      }
      if (v.kind === 'taxi' && v.price !== null && v.price > RIDE_TAXI_MAX_PRICE) {
        ctx.addIssue({ code: 'custom', path: ['price'], message: `النصيب مايزيدش عن ${RIDE_TAXI_MAX_PRICE} جنيه` });
      }
      if (v.returnTime && v.returnTime === v.departTime) {
        ctx.addIssue({ code: 'custom', path: ['returnTime'], message: 'ميعاد الرجوع هو نفس ميعاد الطلوع' });
      }
    });
}

export type RideFormInput = z.infer<ReturnType<typeof rideFormSchema>>;
