import { describe, expect, it } from 'vitest';
import {
  DONATION_CAUSES,
  DONATION_TYPES,
  donationMessage,
  donationTypesFor,
  donationWhatsappLink,
  findCause,
  hasPaymentDetails,
  type DonationCause,
} from './donations';
import { donationFormSchema } from '@/utils/donationForm';

describe('donation causes config', () => {
  it('has unique ids, a name, a description and something to give for every cause', () => {
    const ids = DONATION_CAUSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cause of DONATION_CAUSES) {
      // Saved in the database (donation_requests.cause checks this shape)
      expect(cause.id).toMatch(/^[a-z][a-z-]{1,39}$/);
      expect(cause.name.trim().length).toBeGreaterThanOrEqual(2);
      expect(cause.description.trim()).not.toBe('');
      expect(cause.accepts.length).toBeGreaterThan(0);
    }
  });

  it('includes بيت المال, الجمعية الشرعية and تجهيز عرايس', () => {
    const names = DONATION_CAUSES.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['بيت المال', 'الجمعية الشرعية', 'تجهيز عرايس']));
  });

  it('every filled-in contact and payment detail is well formed', () => {
    for (const cause of DONATION_CAUSES) {
      if (cause.contact?.whatsapp) expect(cause.contact.whatsapp).toMatch(/^201[0125]\d{8}$/);
      if (cause.contact?.phone) expect(cause.contact.phone).toMatch(/^0\d{8,10}$/);
      for (const wallet of cause.payment?.wallets ?? []) {
        expect(wallet.name.trim()).not.toBe('');
        expect(wallet.number).toMatch(/^01[0125]\d{8}$/);
      }
      const bank = cause.payment?.bank;
      if (bank) {
        expect(bank.bankName.trim()).not.toBe('');
        expect(bank.accountName.trim()).not.toBe('');
        expect(bank.accountNumber).toMatch(/^\d{6,20}$/);
        if (bank.iban) expect(bank.iban).toMatch(/^EG\d{27}$/);
      }
    }
  });
});

describe('donation helpers', () => {
  const brides = findCause('brides')!;

  it('offers what the cause accepts, then "حاجة تانية"', () => {
    expect(donationTypesFor(brides)).toEqual(['money', 'furniture', 'other']);
    expect(donationTypesFor(undefined)).toEqual(DONATION_TYPES.map((t) => t.id));
  });

  it('names the cause in the WhatsApp message and sends it to our number by default', () => {
    expect(donationMessage(brides)).toContain('تجهيز عرايس');
    const link = donationWhatsappLink(brides, { name: 'أحمد', type: 'furniture' });
    expect(link.startsWith('https://wa.me/201028928248?text=')).toBe(true);
    const text = decodeURIComponent(link.split('?text=')[1]);
    expect(text).toContain('أحمد');
    expect(text).toContain('عفش وأجهزة');
  });

  it("uses the organization's own WhatsApp once it's filled in", () => {
    const org: DonationCause = { ...brides, contact: { whatsapp: '201000000000' } };
    expect(donationWhatsappLink(org).startsWith('https://wa.me/201000000000?text=')).toBe(true);
  });

  it('shows payment details only when there are some', () => {
    expect(hasPaymentDetails(brides)).toBe(false);
    expect(hasPaymentDetails({ ...brides, payment: {} })).toBe(false);
    expect(hasPaymentDetails({ ...brides, payment: { instapay: 'x@instapay' } })).toBe(true);
  });
});

describe('donation form', () => {
  const valid = { name: '  محمد   علي ', phone: '٠١٠١٢٣٤٥٦٧٨', cause: 'orphans', type: 'money', notes: '' };

  it('accepts a normal request and tidies it', () => {
    const result = donationFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ name: 'محمد علي', phone: '01012345678' });
  });

  it('rejects a bad phone, an unknown cause or type, and long notes', () => {
    expect(donationFormSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false);
    expect(donationFormSchema.safeParse({ ...valid, cause: 'nope' }).success).toBe(false);
    expect(donationFormSchema.safeParse({ ...valid, type: 'gold' }).success).toBe(false);
    expect(donationFormSchema.safeParse({ ...valid, name: 'م' }).success).toBe(false);
    expect(donationFormSchema.safeParse({ ...valid, notes: 'ا'.repeat(501) }).success).toBe(false);
  });
});
