/** Local preview only. A query never writes the saved theme choice. */
export const DARK_PALETTES = [
  { id: 1, name: 'فحمي ودهبي', bg: '#11100e', surface: '#211f1b', raised: '#302b23', ink: '#f6f1e7', muted: '#c0b7a6', accent: '#bfa06b', actionInk: '#17130b', border: '#5b503c', hero: '#302617', heroEnd: '#17140f', gold: '#d3af66' },
  { id: 2, name: 'جرافيت وزمردي', bg: '#121615', surface: '#202826', raised: '#2b3632', ink: '#edf6f0', muted: '#b6c8bf', accent: '#65d6a1', actionInk: '#092319', border: '#486356', hero: '#164631', heroEnd: '#17231d', gold: '#e2bc62' },
  { id: 3, name: 'كحلي ليلي', bg: '#0c1224', surface: '#17223b', raised: '#24344e', ink: '#eff5ff', muted: '#b1c3df', accent: '#78c7fa', actionInk: '#082139', border: '#465d83', hero: '#183f65', heroEnd: '#101a31', gold: '#c9b8ff' },
  { id: 4, name: 'أسود OLED', bg: '#000000', surface: '#101311', raised: '#1c231e', ink: '#f1fff5', muted: '#aebfb4', accent: '#a5efb9', actionInk: '#05200d', border: '#364e3d', hero: '#0b2816', heroEnd: '#000000', gold: '#c4e8ce' },
  { id: 5, name: 'غابة زيتوني', bg: '#10170e', surface: '#202c19', raised: '#303e23', ink: '#f3f6e5', muted: '#bbc7a6', accent: '#c3d987', actionInk: '#17210a', border: '#556641', hero: '#3b5124', heroEnd: '#192612', gold: '#dbc580' },
  { id: 6, name: 'إسبريسو نحاسي', bg: '#1b1210', surface: '#30211d', raised: '#42302a', ink: '#fff1e8', muted: '#d2b7a8', accent: '#f0b38b', actionInk: '#30170c', border: '#765343', hero: '#623b29', heroEnd: '#261a14', gold: '#e4c29a' },
  { id: 7, name: 'سليت فضي', bg: '#141b23', surface: '#252f3b', raised: '#354251', ink: '#f0f6fb', muted: '#becbd6', accent: '#c1d7e9', actionInk: '#17232d', border: '#586d7e', hero: '#3b5366', heroEnd: '#202d39', gold: '#e1d7c5' },
  { id: 8, name: 'برقوقي بنفسجي', bg: '#1b1220', surface: '#302039', raised: '#442e4e', ink: '#fbeefe', muted: '#d4b8db', accent: '#dfb1ed', actionInk: '#2b1135', border: '#775584', hero: '#593669', heroEnd: '#291a32', gold: '#efbdcb' },
  { id: 9, name: 'بترولي زجاجي', bg: '#071d22', surface: '#12323a', raised: '#1c454b', ink: '#e7fcfa', muted: '#abd1d0', accent: '#79ded4', actionInk: '#052826', border: '#3b7478', hero: '#175e65', heroEnd: '#0c2c36', gold: '#c8e5be' },
  { id: 10, name: 'رمادي دافي', bg: '#222220', surface: '#30302d', raised: '#41413c', ink: '#f5f4ed', muted: '#cac8bb', accent: '#e5cc8b', actionInk: '#2e250d', border: '#6d6a58', hero: '#535142', heroEnd: '#2b2b25', gold: '#ded4ae' },
] as const;
export function previewPalette(value: string | null) { return DARK_PALETTES.find(palette => String(palette.id) === value); }
export function applyDarkPalettePreview() {
  const palette = previewPalette(new URLSearchParams(location.search).get('dark'));
  if (!palette) return;
  document.documentElement.dataset.darkPreview = String(palette.id);
  document.documentElement.dataset.theme = 'dark';
  for (const key of ['bg','surface','raised','ink','muted','accent','actionInk','border','hero','heroEnd','gold'] as const) document.documentElement.style.setProperty(`--preview-${key}`, palette[key]);
  document.documentElement.style.colorScheme = 'dark';
}
