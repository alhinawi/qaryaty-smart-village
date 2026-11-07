import { describe, expect, it } from 'vitest';
import { DARK_PALETTES, previewPalette } from './darkPalettes';
function luminance(hex: string) { const channels = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4); return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722; }
function contrast(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
describe('ten private dark-theme choices', () => {
  it('has ten distinct numbered choices and rejects unknown values', () => { expect(DARK_PALETTES).toHaveLength(10); expect(new Set(DARK_PALETTES.map(p=>p.bg)).size).toBe(10); expect(previewPalette('2')?.id).toBe(2); expect(previewPalette('11')).toBeUndefined(); expect(previewPalette(null)).toBeUndefined(); });
  it('keeps body text, secondary text and action labels at AA contrast', () => { for(const p of DARK_PALETTES) { expect(contrast(p.ink,p.surface),`${p.id} body`).toBeGreaterThanOrEqual(4.5); expect(contrast(p.muted,p.surface),`${p.id} muted`).toBeGreaterThanOrEqual(4.5); expect(contrast(p.accent,p.bg),`${p.id} accent`).toBeGreaterThanOrEqual(4.5); expect(contrast(p.actionInk,p.accent),`${p.id} action`).toBeGreaterThanOrEqual(4.5); expect(contrast(p.actionInk,p.gold),`${p.id} gold`).toBeGreaterThanOrEqual(4.5); } });
});
