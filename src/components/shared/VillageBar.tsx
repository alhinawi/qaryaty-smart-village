// ─── "بنعرضلك ناس من منية سندوب" + change village + the nearby toggle
import { useId } from 'react';
import { VILLAGES, nearbyVillages } from '@/data/villages';
import { useReach } from '@/hooks/useReach';

interface VillageBarProps {
  /** What is being shown, e.g. "ناس" or "مشاوير". */
  what?: string;
  className?: string;
}

export function VillageBar({ what = 'ناس', className = '' }: VillageBarProps) {
  const { village, includeNearby, chosen, setVillage, setIncludeNearby } = useReach();
  const selectId = useId();
  const nearby = nearbyVillages(village);

  return (
    <section
      aria-label="قريتك"
      className={`bg-white rounded-2xl border ${chosen ? 'border-gray-100' : 'border-gold'} p-3 flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span aria-hidden="true">📍</span>
        <label htmlFor={selectId} className="text-sm text-text-muted whitespace-nowrap">
          {chosen ? `بنعرضلك ${what} من` : 'اختار قريتك:'}
        </label>
        <select
          id={selectId}
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          className="font-bold text-sm text-primary bg-primary/5 rounded-lg px-2 py-1 border border-primary/20 min-h-[36px]"
        >
          {VILLAGES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {nearby.length > 0 && (
        <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[36px]">
          <input
            type="checkbox"
            role="switch"
            checked={includeNearby}
            onChange={(e) => setIncludeNearby(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
          <span className="font-bold">اعرض القرى القريبة كمان</span>
          <span className="text-xs text-text-muted">({nearby.join('، ')})</span>
        </label>
      )}
    </section>
  );
}
