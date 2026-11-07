import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalReferralRepo } from './localReferralRepo';

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
});

describe('local referral repo', () => {
  beforeEach(() => storage.clear());

  it('rejects an empty code', async () => {
    expect(await createLocalReferralRepo().claim('u1', '  ')).toBe('bad_code');
  });

  it('claims once and shows a stable demo code', async () => {
    const repo = createLocalReferralRepo();
    expect((await repo.getInfo('User_1')).code).toBe('q-user1');
    expect(await repo.claim('u1', 'om_ahmed')).toBe('claimed');
    expect(await repo.claim('u1', 'om_ahmed')).toBe('already');
    const info = await repo.getInfo('u1');
    expect(info.invitedCount).toBe(1);
    expect(info.pointsEarned).toBe(50);
  });
});
