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

// ─── Order Form Schema
export const orderFormSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, { message: 'من فضلك أدخل عنوانك بالتفصيل داخل القرية' }),
  phone: z.preprocess(
    (value) => (typeof value === 'string' ? normalizeEgyptianPhone(value) : value),
    z.string().regex(/^01[0125][0-9]{8}$/, {
      message: 'رقم الموبايل غير صحيح (مثال: 01012345678)',
    })
  ),
  notes: z.string().optional().default(''),
  paymentMethod: z.enum(['cash', 'vodafone', 'instapay']),
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
