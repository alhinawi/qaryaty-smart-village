// ─── Invite link capture: ?ref=CODE survives until the visitor registers
const REF_KEY = 'qaryati_ref_code';

/** Called once at app start: keeps the invite code from the link, if any. */
export function captureReferralFromUrl(): void {
  if (typeof window === 'undefined') return;
  const code = new URLSearchParams(window.location.search).get('ref')?.trim().toLowerCase();
  if (!code) return;
  try {
    localStorage.setItem(REF_KEY, code);
  } catch {
    /* private mode: the invite just won't be attributed */
  }
}

export function storedReferralCode(): string {
  try {
    return localStorage.getItem(REF_KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearStoredReferral(): void {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    /* ignore */
  }
}

/** The personal invite link for an account's code. */
export function referralLink(code: string, origin: string): string {
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}
