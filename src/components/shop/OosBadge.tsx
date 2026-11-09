import { useDisplayPrefsStore, type OosBadgeStyle } from '@/stores/useDisplayPrefsStore';

/**
 * Out-of-stock overlay on a product photo, in the style the owner picked from
 * لوحة التحكم: «dim» darkens the photo with a centered white «خلصان»;
 * «ribbon» puts a red corner ribbon on the untouched photo.
 * The optional `style` prop overrides the stored preference so the admin
 * preview can render both variants with this same component.
 */
export function OosBadge({ size = 'lg', style: styleOverride }: { size?: 'lg' | 'sm'; style?: OosBadgeStyle }) {
  const storedStyle = useDisplayPrefsStore((state) => state.oosBadgeStyle);
  const style = styleOverride ?? storedStyle;
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
