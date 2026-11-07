import { useSyncExternalStore } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { getThemePreference, setThemePreference, subscribeTheme, type ThemePreference } from '@/config/theme';
export function ThemeSelector() {
  const preference = useSyncExternalStore(subscribeTheme, getThemePreference, () => 'auto' as const);
  return <fieldset className="rounded-2xl border border-green/15 p-3 my-3 bg-cream"><legend className="text-sm font-extrabold text-green-dark px-1">شكل التطبيق</legend><div className="grid grid-cols-3 gap-2">{([{ id: 'auto', label: 'تلقائي', Icon: Monitor }, { id: 'light', label: 'فاتح', Icon: Sun }, { id: 'dark', label: 'داكن', Icon: Moon }] as const).map(({ id, label, Icon }) => <button type="button" key={id} aria-pressed={preference === id} onClick={() => setThemePreference(id as ThemePreference)} className={`rounded-xl p-2 flex flex-col items-center gap-1 text-xs font-bold ${preference === id ? 'bg-green text-white' : 'bg-white text-text border border-green/15'}`}><Icon size={17} aria-hidden="true" />{label}</button>)}</div><p className="text-[11px] text-text-muted leading-5 mt-2">التلقائي بيتبع إعداد موبايلك. اختيارك محفوظ على الجهاز ده.</p></fieldset>;
}
