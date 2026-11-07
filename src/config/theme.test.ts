import { describe, expect, it } from 'vitest';
import { resolvedTheme, validTheme } from './theme';
describe('theme preference', () => {
  it('defaults unknown values to system', () => { expect(validTheme(null)).toBe('auto'); expect(validTheme('oops')).toBe('auto'); });
  it('respects explicit selection over system', () => { expect(resolvedTheme('dark', false)).toBe('dark'); expect(resolvedTheme('light', true)).toBe('light'); expect(resolvedTheme('auto', true)).toBe('dark'); expect(resolvedTheme('auto', false)).toBe('light'); });
});
