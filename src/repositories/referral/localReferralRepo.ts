// ─── Device-only referrals for the demo backend
import type { ReferralRepo } from './types';

const CLAIMED_KEY = 'qaryati_mock_referral_claimed';

/** A stable demo code per account id, e.g. q-a1b2c3. */
function demoCode(userId: string): string {
  const slug = userId.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
  return `q-${slug || 'demo'}`;
}

export function createLocalReferralRepo(): ReferralRepo {
  return {
    async getInfo(userId) {
      let claimed = false;
      try {
        claimed = localStorage.getItem(CLAIMED_KEY) === '1';
      } catch {
        /* private mode */
      }
      return { code: demoCode(userId), invitedCount: claimed ? 1 : 0, pointsEarned: claimed ? 50 : 0 };
    },
    async claim(_userId, code) {
      const c = code.trim().toLowerCase();
      if (!c) return 'bad_code';
      try {
        if (localStorage.getItem(CLAIMED_KEY) === '1') return 'already';
        localStorage.setItem(CLAIMED_KEY, '1');
      } catch {
        /* private mode */
      }
      return 'claimed';
    },
  };
}
