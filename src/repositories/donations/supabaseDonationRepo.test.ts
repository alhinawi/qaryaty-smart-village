import { describe, expect, it } from 'vitest';
import { donationErrorMessage, donationToParams } from './supabaseDonationRepo';

describe('supabase donation repo', () => {
  it('sends the fields the database function expects, with empty notes as null', () => {
    const params = donationToParams('id-1', {
      name: 'محمد',
      phone: '01012345678',
      cause: 'brides',
      causeName: 'تجهيز عرايس',
      type: 'furniture',
      notes: '',
    });
    expect(params).toEqual({
      p_id: 'id-1',
      p_donor_name: 'محمد',
      p_phone: '01012345678',
      p_cause: 'brides',
      p_cause_name: 'تجهيز عرايس',
      p_donation_type: 'furniture',
      p_notes: null,
    });
  });

  it("turns the database's limits into messages people understand", () => {
    expect(donationErrorMessage('donation:too_many_open')).toContain('مستنية');
    expect(donationErrorMessage('donation:busy')).toContain('كتير');
    expect(donationErrorMessage('something else')).toContain('اترفض');
  });
});
