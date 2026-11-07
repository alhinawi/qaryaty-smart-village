import { DARK_PALETTES } from './darkPalettes';
export const LIGHT_PALETTES = [
  { id: 1, name: 'أبيض أخضر', bg: '#f4f8f5', surface: '#ffffff', raised: '#e7f1eb', ink: '#172b20', muted: '#53695c', border: '#c7dace' },
  { id: 2, name: 'عاجي دافي', bg: '#faf6ed', surface: '#fffdf8', raised: '#f0ebdb', ink: '#252b20', muted: '#626858', border: '#d9d6c5' },
  { id: 3, name: 'نعناعي', bg: '#edf7f0', surface: '#fafffb', raised: '#dceee1', ink: '#173a28', muted: '#4b6b58', border: '#bcd7c5' },
  { id: 4, name: 'رمادي هادي', bg: '#f0f2f1', surface: '#ffffff', raised: '#e3e7e4', ink: '#202b25', muted: '#59675f', border: '#c9d1cc' },
  { id: 5, name: 'رملي دهبي', bg: '#f5f0e3', surface: '#fffdf6', raised: '#eae2ce', ink: '#303025', muted: '#676451', border: '#d7ccb0' },
  { id: 6, name: 'أخضر فاتح ناعم', bg: '#f3f6eb', surface: '#fdfff8', raised: '#e4ebd8', ink: '#283623', muted: '#5b6b50', border: '#ccd8be' },
] as const;
export const PALETTE_KEY = 'qaryati-theme-palettes';
export interface PaletteChoice { darkId: number; lightId: number }
export function validPaletteChoice(value: unknown): PaletteChoice {
  const candidate = value as Partial<PaletteChoice> | null;
  return { darkId: DARK_PALETTES.some(p => p.id === candidate?.darkId) ? candidate!.darkId! : 2, lightId: LIGHT_PALETTES.some(p => p.id === candidate?.lightId) ? candidate!.lightId! : 1 };
}
export function applyPalette(mode: 'dark' | 'light', choice: PaletteChoice) {
  const dark = DARK_PALETTES.find(p => p.id === choice.darkId) ?? DARK_PALETTES[1];
  const light = LIGHT_PALETTES.find(p => p.id === choice.lightId) ?? LIGHT_PALETTES[0];
  const palette = mode === 'dark' ? dark : light;
  const root = document.documentElement;
  root.dataset.palette = `${mode}-${palette.id}`;
  delete root.dataset.darkPreview;
  // Background choices vary. Main actions and the Qaryati logo stay green/gold.
  const values = { ...palette, accent: mode === 'dark' ? '#8bdda8' : '#1a7a4a', actionInk: '#16351f', hero: mode === 'dark' ? dark.hero : '#125936', heroEnd: mode === 'dark' ? dark.heroEnd : '#1a7a4a', gold: '#ffc72c' };
  for (const key of ['bg','surface','raised','ink','muted','border','accent','actionInk','hero','heroEnd','gold'] as const) root.style.setProperty(`--preview-${key}`, values[key]);
}
