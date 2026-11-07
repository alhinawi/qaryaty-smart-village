import { describe, expect, it } from 'vitest';
import { voiceError, voiceQuery } from './voiceSearch';
describe('Egyptian voice query', () => {
  it('keeps product words while removing simple request openings', () => {
    expect(voiceQuery('عايز فراخ مشوية')).toBe('فراخ مشوية');
    expect(voiceQuery('سباك')).toBe('سباك');
    expect(voiceQuery('  دور على سباك؟ ')).toBe('سباك');
    expect(voiceQuery('دجاج فراخ مشوية')).toBe('دجاج فراخ مشوية');
  });
  it('has a useful permission fallback', () => {
    expect(voiceError('not-allowed')).toContain('إذن الميكروفون');
    expect(voiceError('network')).toContain('الإنترنت');
  });
});
