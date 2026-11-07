export type ThemePreference = 'auto' | 'light' | 'dark';
export const THEME_KEY = 'qaryati-theme';
export function validTheme(value: unknown): ThemePreference { return value === 'light' || value === 'dark' ? value : 'auto'; }
export function resolvedTheme(preference: ThemePreference, systemDark: boolean): 'dark' | 'light' { return preference === 'auto' ? (systemDark ? 'dark' : 'light') : preference; }
let preference: ThemePreference = 'auto';
const listeners = new Set<() => void>();
export function getThemePreference() { return preference; }
export function subscribeTheme(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function apply() { const dark = resolvedTheme(preference, matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark; document.documentElement.style.colorScheme = dark; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark === 'dark' ? '#101b17' : '#1a7a4a'); }
export function setThemePreference(value: ThemePreference) { preference = validTheme(value); try { localStorage.setItem(THEME_KEY, preference); } catch { /* session choice still works */ } apply(); listeners.forEach(listener => listener()); }
export function initTheme() {
  try { preference = validTheme(localStorage.getItem(THEME_KEY)); } catch { preference = 'auto'; }
  apply(); const media = matchMedia('(prefers-color-scheme: dark)'); media.addEventListener('change', apply);
  const storage = (event: StorageEvent) => { if (event.key === THEME_KEY) { preference = validTheme(event.newValue); apply(); listeners.forEach(listener => listener()); } };
  window.addEventListener('storage', storage);
  return () => { media.removeEventListener('change', apply); window.removeEventListener('storage', storage); };
}
