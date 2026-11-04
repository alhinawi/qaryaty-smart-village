import { describe, expect, it } from 'vitest';
import { TAB_PATHS, pathToTab } from './routes';

describe('pathToTab', () => {
  it('maps every tab path back to its tab', () => {
    for (const [tab, path] of Object.entries(TAB_PATHS)) {
      expect(pathToTab(path)).toBe(tab);
    }
  });

  it('ignores a trailing slash', () => {
    expect(pathToTab('/orders/')).toBe('orders');
  });

  it('returns null for pages outside the tabs', () => {
    expect(pathToTab('/login')).toBeNull();
    expect(pathToTab('/about')).toBeNull();
    expect(pathToTab('/groups')).toBeNull();
    expect(pathToTab('/admin/orders')).toBeNull();
  });
});
