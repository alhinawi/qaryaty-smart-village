// ─── Provider dashboard feature flag
// Hidden from the public until Mohamed turns it on. There is no backend for it
// yet: every edit a provider makes stays on their own device (localStorage).
// Turn it on for a build with VITE_PROVIDER_DASHBOARD=true, or preview it in
// one browser only:
//   localStorage.setItem('qaryati_provider_dashboard', '1') then reload.

const PREVIEW_KEY = 'qaryati_provider_dashboard';

/** Is the provider dashboard reachable in this browser/build? */
export function isProviderDashboardEnabled(): boolean {
  if (import.meta.env.VITE_PROVIDER_DASHBOARD === 'true') return true;
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}
