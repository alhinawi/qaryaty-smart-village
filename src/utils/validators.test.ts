import { describe, expect, it } from 'vitest';
import { normalizeEgyptianPhone, orderFormSchema } from './validators';

const validOrder = {
  address: 'شارع الجامع الكبير',
  phone: '01012345678',
  notes: '',
  paymentMethod: 'cash' as const,
  discountCode: '',
};

describe('normalizeEgyptianPhone', () => {
  it.each([
    ['01012345678', '01012345678'],
    ['٠١٠١٢٣٤٥٦٧٨', '01012345678'],
    ['۰۱۰۱۲۳۴۵۶۷۸', '01012345678'],
    ['+20 101 234 5678', '01012345678'],
    ['+٢٠١٠١٢٣٤٥٦٧٨', '01012345678'],
    ['00201112345678', '01112345678'],
    ['201212345678', '01212345678'],
    ['010-1234-5678', '01012345678'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeEgyptianPhone(input)).toBe(expected);
  });
});

describe('orderFormSchema phone', () => {
  it.each(['01012345678', '01112345678', '01212345678', '01512345678', '٠١٥١٢٣٤٥٦٧٨', '+201012345678'])(
    'accepts %s',
    (phone) => {
      const result = orderFormSchema.safeParse({ ...validOrder, phone });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone).toMatch(/^01[0125]\d{8}$/);
    }
  );

  it.each([
    ['wrong prefix', '01312345678'],
    ['too short', '0101234567'],
    ['too long', '010123456789'],
    ['landline', '0223456789'],
    ['letters', '0101234abcd'],
    ['empty', ''],
  ])('rejects %s', (_label, phone) => {
    const result = orderFormSchema.safeParse({ ...validOrder, phone });
    expect(result.success).toBe(false);
  });

  it('needs an address of at least 5 characters', () => {
    expect(orderFormSchema.safeParse({ ...validOrder, address: 'بيت' }).success).toBe(false);
  });
});
