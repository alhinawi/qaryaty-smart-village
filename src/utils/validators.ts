// ─── Imports
import { z } from 'zod';

// ─── Phone normalization
// Accepts what people actually type on an Arabic keyboard:
// ٠١٠١٢٣٤٥٦٧٨, Persian digits, spaces/dashes, and +20 / 0020 prefixes.
export function normalizeEgyptianPhone(value: string): string {
  let digits = value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-().]/g, '');

  if (digits.startsWith('+20')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('0020')) digits = '0' + digits.slice(4);
  else if (/^201[0125]\d{8}$/.test(digits)) digits = '0' + digits.slice(2);

  return digits;
}

// ─── Shared field schemas
/** Egyptian mobile number; Arabic digits, spaces and +20 are normalized first. */
export const egyptianPhoneSchema = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeEgyptianPhone(value) : value),
  z.string().regex(/^01[0125][0-9]{8}$/, {
    message: 'رقم الموبايل غير صحيح (مثال: 01012345678)',
  })
);

// ─── Order Form Schema
export const orderFormSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, { message: 'من فضلك أدخل عنوانك بالتفصيل داخل القرية' }),
  phone: egyptianPhoneSchema,
  notes: z.string().optional().default(''),
  paymentMethod: z.enum(['cash', 'card', 'wallet']),
  discountCode: z.string().optional().default(''),
});

export type OrderFormSchemaType = z.infer<typeof orderFormSchema>;

// ─── Cart Item Quantity Schema
export const cartQuantitySchema = z
  .number()
  .int({ message: 'الكمية يجب أن تكون عدداً صحيحاً' })
  .min(1, { message: 'أقل كمية هي 1' })
  .max(100, { message: 'أقصى كمية هي 100' });

// ─── Rating Schema
export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

// ─── Auth Schemas
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, { message: 'الإيميل طويل أوي' })
  .email({ message: 'اكتب إيميل صحيح، زي name@gmail.com' });

/** Names nobody may take: they look like the site or its staff. Mirrored in supabase/schema.sql. */
export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'help',
  'qaryati',
  'qaryaty',
] as const;

/**
 * Public handle: 3–20 English letters, numbers or _, stored lowercase.
 * A leading @ is dropped, so "@Ahmed_10" becomes "ahmed_10".
 */
export const usernameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@/, '').toLowerCase())
  .pipe(
    z
      .string()
      .min(1, { message: 'اختار اسم مستخدم' })
      .min(3, { message: 'اسم المستخدم لازم يكون 3 حروف على الأقل' })
      .max(20, { message: 'اسم المستخدم لازم يكون 20 حرف بالكتير' })
      .regex(/^[a-z0-9_]+$/, {
        message: 'اسم المستخدم بالحروف الإنجليزي والأرقام و _ بس، من غير مسافات',
      })
      .refine((value) => /[a-z]/.test(value), {
        message: 'اسم المستخدم لازم يكون فيه حرف إنجليزي واحد على الأقل',
      })
      .refine((value) => !(RESERVED_USERNAMES as readonly string[]).includes(value), {
        message: 'اسم المستخدم ده محجوز، اختار اسم تاني',
      })
  );

/** Same rules as the form, for code that only needs the cleaned value. */
export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase();
}

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'اكتب كلمة السر' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordSchema = z
  .string()
  .min(8, { message: 'كلمة السر لازم تكون 8 حروف أو أرقام على الأقل' })
  .max(64, { message: 'كلمة السر طويلة أوي' })
  .regex(/[0-9\u0660-\u0669]/, { message: 'كلمة السر لازم يكون فيها رقم واحد على الأقل' })
  .regex(/[^0-9\u0660-\u0669\s]/, { message: 'كلمة السر لازم يكون فيها حرف واحد على الأقل' });

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { message: 'اكتب اسمك (3 حروف على الأقل)' })
      .max(40, { message: 'الاسم طويل أوي' }),
    username: usernameSchema,
    email: emailSchema,
    phone: egyptianPhoneSchema,
    village: z.string().trim().min(2, { message: 'اكتب اسم قريتك' }).max(60),
    address: z
      .string()
      .trim()
      .min(5, { message: 'من فضلك أدخل عنوانك بالتفصيل داخل القرية' })
      .max(120),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'كلمتين السر مش زي بعض',
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/** Zod issues → { field: first message } for the forms. */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key != null && !errors[String(key)]) errors[String(key)] = issue.message;
  }
  return errors;
}
