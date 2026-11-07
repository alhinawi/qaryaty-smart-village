/** Approved motion pack2: small distance, bounded stagger, no layout animation. */
export const MOTION = { duration: 260, distance: 8, stagger: 35, press: 0.98 } as const;
export function initMotion(): void { document.documentElement.dataset.motion = '2'; }
