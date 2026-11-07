// ─── Referrals: personal invite link + points
export interface ReferralInfo {
  /** The account's personal code: the username when there is one. */
  code: string;
  /** Friends who claimed this code. */
  invitedCount: number;
  /** Points this account earned from referrals (ledger sum). */
  pointsEarned: number;
}

export type ClaimResult = 'claimed' | 'bad_code' | 'self' | 'already';

export interface ReferralRepo {
  getInfo(userId: string): Promise<ReferralInfo>;
  claim(userId: string, code: string): Promise<ClaimResult>;
}
