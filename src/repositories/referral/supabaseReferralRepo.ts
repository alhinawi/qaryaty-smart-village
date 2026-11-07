// ─── Referrals on Supabase
// Reads hit profiles/points_ledger directly; claiming goes through the
// security-definer claim_referral function (see the referrals migration).
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '@/repositories/errors';
import type { ClaimResult, ReferralRepo } from './types';

export function createSupabaseReferralRepo(getClient: () => Promise<SupabaseClient>): ReferralRepo {
  return {
    async getInfo(userId) {
      const supabase = await getClient();
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .maybeSingle();
      if (pErr) throw new RepoError('unavailable', 'ماقدرناش نجيب بيانات الدعوات', { cause: pErr });
      const { count: invitedCount, error: cErr } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId);
      if (cErr) throw new RepoError('unavailable', 'ماقدرناش نجيب بيانات الدعوات', { cause: cErr });
      const { data: rows, error: lErr } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('profile_id', userId);
      if (lErr) throw new RepoError('unavailable', 'ماقدرناش نجيب بيانات الدعوات', { cause: lErr });
      const pointsEarned = (rows ?? []).reduce((sum, r) => sum + Number(r.points), 0);
      return { code: profile?.referral_code ?? '', invitedCount: invitedCount ?? 0, pointsEarned };
    },

    async claim(_userId, code) {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('claim_referral', { p_code: code });
      if (error) throw new RepoError('unavailable', 'ماقدرناش نسجل كود الدعوة دلوقتي', { cause: error });
      const result = data as { claimed?: boolean; reason?: string } | null;
      if (result?.claimed) return 'claimed';
      return (result?.reason as ClaimResult | undefined) ?? 'bad_code';
    },
  };
}
