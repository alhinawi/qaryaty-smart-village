import { describe, expect, it } from 'vitest';
import { LIGHT_PALETTES, validPaletteChoice } from './themePalettes';
function luminance(hex: string) { const channels = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4); return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722; }
function contrast(a: string,b: string) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
describe('brand-safe theme choices', () => {
  it('validates independent light and dark choices', () => { expect(validPaletteChoice(null)).toEqual({darkId:2,lightId:1}); expect(validPaletteChoice({darkId:10,lightId:6})).toEqual({darkId:10,lightId:6}); expect(validPaletteChoice({darkId:11,lightId:0})).toEqual({darkId:2,lightId:1}); });
  it('has six readable light backgrounds with green/gold actions', () => { expect(LIGHT_PALETTES).toHaveLength(6);for(const p of LIGHT_PALETTES){expect(contrast(p.ink,p.surface)).toBeGreaterThanOrEqual(4.5);expect(contrast(p.muted,p.surface)).toBeGreaterThanOrEqual(4.5);expect(contrast('#176b42',p.bg)).toBeGreaterThanOrEqual(4.5);}expect(contrast('#ffffff','#1a7a4a')).toBeGreaterThanOrEqual(4.5);expect(contrast('#16351f','#ffc72c')).toBeGreaterThanOrEqual(4.5);});
});
