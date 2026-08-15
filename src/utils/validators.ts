// ─── Imports
import { z } from 'zod';

// ─── Order Form Schema
export const orderFormSchema = z.object({
  address: z
    .string()
    .trim()
    .min(3, { message: 'من فضلك أدخل عنوانك بالتفصيل داخل القرية' }),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, {
      message: 'رقم الموبايل غير صحيح (مثال: 01012345678)',
    }),
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
