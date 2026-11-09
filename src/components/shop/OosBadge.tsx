import { useDisplayPrefsStore } from '@/stores/useDisplayPrefsStore';

/**
 * Out-of-stock overlay on a product photo, in the style the owner picked from
 * لوحة التحكم: «dim» darkens the photo with a centered white «خلصان»;
 * «ribbon» puts a red corner ribbon on the untouched photo.
 */
export function OosBadge({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const style = useDisplayPrefsStore((state) => state.oosBadgeStyle);
  if (style === 'ribbon') {
    return (
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -left-9 ${size === 'lg' ? 'top-4' : 'top-3'} w-32 -rotate-45 bg-red-600 text-white ${size === 'lg' ? 'text-xs' : 'text-[10px]'} font-extrabold text-center py-1 shadow-md`}>
          خلصان
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 rounded-xl bg-black/55 flex items-center justify-center pointer-events-none">
      <span className={`text-white ${size === 'lg' ? 'text-lg' : 'text-sm'} font-extrabold`}>خلصان</span>
    </div>
  );
}
