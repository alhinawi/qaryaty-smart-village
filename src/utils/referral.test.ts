import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureReferralFromUrl, clearStoredReferral, referralLink, storedReferralCode } from './referral';

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
});

const setSearch = (search: string) => {
  vi.stubGlobal('window', { location: { search } });
};

describe('referral capture', () => {
  beforeEach(() => storage.clear());

  it('keeps the code from ?ref= and normalizes it', () => {
    setSearch('?ref=Om_Ahmed');
    captureReferralFromUrl();
    expect(storedReferralCode()).toBe('om_ahmed');
  });

  it('does nothing without a ref param', () => {
    setSearch('');
    captureReferralFromUrl();
    expect(storedReferralCode()).toBe('');
  });

  it('clears after claiming', () => {
    setSearch('?ref=abc');
    captureReferralFromUrl();
    clearStoredReferral();
    expect(storedReferralCode()).toBe('');
  });

  it('builds the personal link', () => {
    expect(referralLink('om_ahmed', 'https://qaryaty.vercel.app')).toBe('https://qaryaty.vercel.app/?ref=om_ahmed');
  });
});
