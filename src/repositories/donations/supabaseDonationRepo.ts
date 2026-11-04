// ─── Donation requests saved in Supabase (see supabase/donations.sql)
// Visitors can't touch the table; they go through public.submit_donation_request(),
// which checks the fields and the limits again.
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '../errors';
import { isRejectedByDatabase } from '../orders/supabaseOrderRepo';
import type { DonationRepo, NewDonationRequest } from './types';

const MESSAGES: Record<string, string> = {
  'donation:too_many_open': 'عندك طلبات تبرع لسه مستنية ردنا. هنكلمك قريب، أو ابعتلنا على واتساب.',
  'donation:busy': 'فيه طلبات كتير دلوقتي. جرّب كمان شوية، أو ابعتلنا على واتساب.',
  'donation:blocked': 'حسابك موقوف، ومش هنقدر نسجل الطلب. كلمنا على واتساب.',
};
const REJECTED_MESSAGE = 'الطلب اترفض، راجع البيانات وجرّب تاني';

/** The database's error code ('donation:busy'…) → the message the form shows */
export function donationErrorMessage(message: string | undefined): string {
  const key = Object.keys(MESSAGES).find((k) => message?.includes(k));
  return key ? MESSAGES[key] : REJECTED_MESSAGE;
}

export function donationToParams(id: string, input: NewDonationRequest) {
  return {
    p_id: id,
    p_donor_name: input.name,
    p_phone: input.phone,
    p_cause: input.cause,
    p_cause_name: input.causeName,
    p_donation_type: input.type,
    p_notes: input.notes || null,
  };
}

export function createSupabaseDonationRepo(getClient: () => Promise<SupabaseClient>): DonationRepo {
  return {
    async submitDonationRequest(input) {
      const supabase = await getClient();
      const id = crypto.randomUUID();
      const { error } = await supabase.rpc('submit_donation_request', donationToParams(id, input));
      if (error) {
        if (isRejectedByDatabase(error.code) || error.message?.startsWith('donation:')) {
          throw new RepoError('rejected', donationErrorMessage(error.message), { cause: error });
        }
        throw error;
      }
      return id;
    },
  };
}
