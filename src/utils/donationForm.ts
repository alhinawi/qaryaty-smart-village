// ─── The "عايز أتبرع" form on /donate: checks before it goes to Supabase
// The database checks the same things again in public.submit_donation_request().
import { z } from 'zod';
import { DONATION_CAUSES, type DonationType } from '@/config/donations';
import { egyptianPhoneSchema } from './validators';

const TYPES = ['money', 'clothes', 'furniture', 'food', 'other'] as const satisfies readonly DonationType[];
const CAUSE_IDS = DONATION_CAUSES.map((c) => c.id);

const squish = (value: unknown) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value);

export const donationFormSchema = z.object({
  name: z.preprocess(
    squish,
    z.string().min(2, { message: 'اكتب اسمك' }).max(80, { message: 'الاسم طويل أوي' })
  ),
  phone: egyptianPhoneSchema,
  cause: z.string().refine((id) => CAUSE_IDS.includes(id), { message: 'اختار باب الخير اللي عايز تتبرع له' }),
  type: z.enum(TYPES, { message: 'اختار هتتبرع بإيه' }),
  notes: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().max(500, { message: 'الملاحظات ماتزيدش عن 500 حرف' })
  ),
});

export type DonationFormInput = z.infer<typeof donationFormSchema>;
