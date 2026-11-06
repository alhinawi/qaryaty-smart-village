// ─── The "أضف وظيفة" form: checks before it goes to Supabase
// The database checks the same limits again (see the jobs migration).
import { z } from 'zod';
import { egyptianPhoneSchema } from './validators';

const squish = (value: unknown) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value);
const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : value);

export const jobFormSchema = z.object({
  title: z.preprocess(
    squish,
    z.string().min(3, { message: 'اكتب اسم الشغلانة (مثلًا: بائع في سوبر ماركت)' }).max(80, { message: 'الاسم طويل أوي' })
  ),
  employer: z.preprocess(
    squish,
    z.string().min(2, { message: 'اكتب اسم المحل أو صاحب الشغل' }).max(80, { message: 'الاسم طويل أوي' })
  ),
  village: z.preprocess(
    squish,
    z.string().min(2, { message: 'اختار القرية' }).max(120, { message: 'اسم القرية طويل أوي' })
  ),
  type: z.enum(['full_time', 'part_time', 'daily'], { message: 'اختار نوع الشغل' }),
  hours: z.preprocess(squish, z.string().max(80, { message: 'المواعيد ماتزيدش عن 80 حرف' })),
  salary: z.preprocess(squish, z.string().max(60, { message: 'المرتب مايزيدش عن 60 حرف' })),
  description: z.preprocess(
    trim,
    z
      .string()
      .min(10, { message: 'اكتب سطرين عن الشغل والمطلوب' })
      .max(1000, { message: 'الوصف مايزيدش عن 1000 حرف' })
  ),
  phone: egyptianPhoneSchema,
  whatsapp: z.boolean(),
});

export type JobFormInput = z.infer<typeof jobFormSchema>;
