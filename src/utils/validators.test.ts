import { describe, expect, it } from 'vitest';
import { normalizeEgyptianPhone, normalizeUsername, orderFormSchema, usernameSchema } from './validators';

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

describe('usernameSchema', () => {
  it.each([
    ['ahmed', 'ahmed'],
    ['Ahmed_10', 'ahmed_10'],
    ['  @Hinawi ', 'hinawi'],
    ['abc', 'abc'],
    ['a'.repeat(20), 'a'.repeat(20)],
    ['_mona_2026', '_mona_2026'],
  ])('accepts %j as %j', (input, expected) => {
    const r = usernameSchema.safeParse(input);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe(expected);
  });

  it.each([
    ['', 'اختار اسم مستخدم'],
    ['ab', '3 حروف على الأقل'],
    ['a'.repeat(21), '20 حرف بالكتير'],
    ['أحمد', 'بالحروف الإنجليزي'],
    ['ahmed ali', 'بالحروف الإنجليزي'],
    ['ahmed.ali', 'بالحروف الإنجليزي'],
    ['ahmed-ali', 'بالحروف الإنجليزي'],
    ['ahmed١٢', 'بالحروف الإنجليزي'],
    ['12345', 'حرف إنجليزي واحد'],
    ['___', 'حرف إنجليزي واحد'],
    ['Admin', 'محجوز'],
    ['qaryati', 'محجوز'],
  ])('rejects %j with an Arabic message', (input, message) => {
    const r = usernameSchema.safeParse(input);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain(message);
  });

  it('normalizeUsername matches what the schema stores', () => {
    expect(normalizeUsername(' @Ahmed_10 ')).toBe('ahmed_10');
  });
});
