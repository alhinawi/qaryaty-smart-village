import { applyPalette, PALETTE_KEY, validPaletteChoice, type PaletteChoice } from './themePalettes';
export type ThemePreference = 'auto' | 'light' | 'dark';
export const THEME_KEY = 'qaryati-theme';
export function validTheme(value: unknown): ThemePreference { return value === 'light' || value === 'dark' ? value : 'auto'; }
export function resolvedTheme(preference: ThemePreference, systemDark: boolean): 'dark' | 'light' { return preference === 'auto' ? (systemDark ? 'dark' : 'light') : preference; }
let preference: ThemePreference = 'auto';
let palettes = validPaletteChoice(null);
let snapshot: PaletteChoice & { preference: ThemePreference } = { preference, ...palettes };
const listeners = new Set<() => void>();
export function getThemePreference() { return preference; }
export function getThemeOptions() { return snapshot; }
export function subscribeTheme(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function notify() { snapshot = { preference, ...palettes }; listeners.forEach(listener => listener()); }
function apply() {
  const mode = resolvedTheme(preference, matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.dataset.theme = mode; root.style.colorScheme = mode;
  applyPalette(mode, palettes);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#101b17' : '#1a7a4a');
}
export function setThemePreference(value: ThemePreference) { preference = validTheme(value); try { localStorage.setItem(THEME_KEY, preference); } catch { /* session choice still works */ } apply(); notify(); }
export function setThemePalette(mode: 'dark' | 'light', id: number) {
  palettes = validPaletteChoice({ ...palettes, [mode === 'dark' ? 'darkId' : 'lightId']: id });
  preference = mode;
  try { localStorage.setItem(PALETTE_KEY, JSON.stringify(palettes)); localStorage.setItem(THEME_KEY, mode); } catch { /* session-only choice */ }
  apply(); notify();
}
function readSaved() {
  try { preference = validTheme(localStorage.getItem(THEME_KEY)); palettes = validPaletteChoice(JSON.parse(localStorage.getItem(PALETTE_KEY) ?? 'null')); }
  catch { preference = 'auto'; palettes = validPaletteChoice(null); }
}
export function initTheme() {
  readSaved();
  const query = new URLSearchParams(location.search);
  const dark = Number(query.get('dark')), light = Number(query.get('light'));
  if (query.has('dark') && dark >= 1 && dark <= 10 && Number.isInteger(dark)) { preference = 'dark'; palettes = { ...palettes, darkId: dark }; }
  else if (query.has('light') && light >= 1 && light <= 6 && Number.isInteger(light)) { preference = 'light'; palettes = { ...palettes, lightId: light }; }
  apply(); notify();
  const media = matchMedia('(prefers-color-scheme: dark)'); media.addEventListener('change', apply);
  const storage = (event: StorageEvent) => { if (event.key === THEME_KEY || event.key === PALETTE_KEY || event.key === null) { readSaved(); apply(); notify(); } };
  window.addEventListener('storage', storage);
  return () => { media.removeEventListener('change', apply); window.removeEventListener('storage', storage); };
}
