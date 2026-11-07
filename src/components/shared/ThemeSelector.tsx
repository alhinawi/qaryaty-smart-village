import { useState, useSyncExternalStore } from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { getThemeOptions, setThemePalette, setThemePreference, subscribeTheme } from '@/config/theme';
import { DARK_PALETTES } from '@/config/darkPalettes';
import { LIGHT_PALETTES } from '@/config/themePalettes';
export function ThemeSelector() {
  const options = useSyncExternalStore(subscribeTheme, getThemeOptions, getThemeOptions);
  const [tab, setTab] = useState<'dark' | 'light'>(options.preference === 'light' ? 'light' : 'dark');
  const palettes = tab === 'dark' ? DARK_PALETTES : LIGHT_PALETTES;
  return <fieldset className="rounded-2xl border border-green/15 p-3 my-3 bg-cream"><legend className="text-sm font-extrabold text-green-dark px-1">شكل التطبيق</legend>
    <div className="grid grid-cols-3 gap-2">{([{ id: 'auto', label: 'تلقائي', Icon: Monitor }, { id: 'light', label: 'فاتح', Icon: Sun }, { id: 'dark', label: 'داكن', Icon: Moon }] as const).map(({ id, label, Icon }) => <button type="button" key={id} aria-pressed={options.preference === id} onClick={() => { setThemePreference(id); if (id !== 'auto') setTab(id); }} className={`min-h-12 rounded-xl p-2 flex flex-col items-center gap-1 text-xs font-bold ${options.preference === id ? 'bg-green text-white' : 'bg-white text-text border border-green/15'}`}><Icon size={17} aria-hidden="true" />{label}</button>)}</div>
    <p className="text-[11px] text-text-muted leading-5 mt-2">التلقائي بيتبع إعداد جهازك، مع الثيم اللي اخترته لكل وضع. اختيارك محفوظ على الجهاز ده، مش على كل أجهزتك.</p>
    <div className="flex gap-2 mt-4 mb-3" role="group" aria-label="ألوان الثيم"><button type="button" aria-pressed={tab === 'dark'} onClick={() => setTab('dark')} className={`flex-1 rounded-xl p-2 min-h-11 text-xs font-bold ${tab === 'dark' ? 'bg-green text-white' : 'bg-white text-text'}`}>10 ثيمات داكنة</button><button type="button" aria-pressed={tab === 'light'} onClick={() => setTab('light')} className={`flex-1 rounded-xl p-2 min-h-11 text-xs font-bold ${tab === 'light' ? 'bg-green text-white' : 'bg-white text-text'}`}>6 ثيمات فاتحة</button></div>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label={tab === 'dark' ? 'الثيمات الداكنة' : 'الثيمات الفاتحة'}>{palettes.map(palette => {
      const selected = (tab === 'dark' ? options.darkId : options.lightId) === palette.id;
      return <button type="button" key={palette.id} aria-pressed={selected} aria-label={`${tab === 'dark' ? 'داكن' : 'فاتح'} ${palette.id}: ${palette.name}`} onClick={() => setThemePalette(tab, palette.id)} className={`relative text-right overflow-hidden rounded-xl border-2 ${selected ? 'border-green' : 'border-gray-200'}`}>
        <span className="block p-2 h-[40px]" style={{ background: palette.bg }} aria-hidden="true"><span className="flex h-3 gap-1 mb-1"><span className="w-3 rounded bg-green" /><span className="w-6 rounded bg-gold" /></span><span className="block rounded h-5 border" style={{ background: palette.surface, borderColor: palette.border }} /></span>
        <span className="flex items-start gap-1 p-2 bg-white min-h-11 text-[11px] leading-5 font-bold text-text"><span className="text-green">{palette.id}.</span><span className="flex-1">{palette.name}</span>{selected && <Check size={15} className="shrink-0 text-green mt-0.5" aria-hidden="true" />}</span>
      </button>;
    })}</div>
    <p className="text-[11px] text-text-muted leading-5 mt-3">كل الألوان بتحافظ على أخضر ودهبي قريتي. اختيار لون بيشغّل وضعه، وتقدر ترجع للتلقائي.</p>
  </fieldset>;
}
