/** Review-only packs. No URL flag means no motion overrides or added UI. */
export type MotionPack = '1' | '2' | '3';
export function readMotionPack(value: string | null): MotionPack | null { return value === '1' || value === '2' || value === '3' ? value : null; }
export const MOTION_PACKS = {
  '1': { label: '١ · هادي وسريع', duration: 160, distance: 0, stagger: 0, press: 0.99 },
  '2': { label: '٢ · أخضر راقي', duration: 260, distance: 8, stagger: 35, press: 0.98 },
  '3': { label: '٣ · حيوية خفيفة', duration: 340, distance: 16, stagger: 50, press: 0.97 },
} as const;
export function initMotionPreview(): void {
  const pack = readMotionPack(new URLSearchParams(location.search).get('motion'));
  if (!pack) return;
  document.documentElement.dataset.motion = pack;
  const badge = document.createElement('aside');
  badge.id = 'motion-pack-label'; badge.textContent = MOTION_PACKS[pack].label;
  badge.setAttribute('aria-label', `ستايل الحركة ${MOTION_PACKS[pack].label}`);
  document.body.append(badge);
}
