import { it, expect } from 'vitest';
import { MOTION_PACKS, readMotionPack } from './motionPreview';
it('only enables explicit numbered previews', () => { for(const value of [null,'','4','true','undefined'])expect(readMotionPack(value)).toBe(null);for(const value of ['1','2','3'])expect(readMotionPack(value)).toBe(value); });
it('caps duration and distances for lightweight phone motion', () => {for(const pack of Object.values(MOTION_PACKS)){expect(pack.duration).toBeLessThanOrEqual(340);expect(pack.distance).toBeLessThanOrEqual(16);expect(pack.stagger).toBeLessThanOrEqual(50);expect(pack.press).toBeGreaterThanOrEqual(.97);} });
