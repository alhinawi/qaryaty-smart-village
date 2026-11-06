import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isProviderDashboardEnabled } from './providerDashboard';

// The app runs in a browser; tests run in node, so stub the one thing the flag reads.
const store = new Map<string, string>();

beforeEach(() => {
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
});

afterEach(() => {
  store.clear();
  delete (globalThis as Record<string, unknown>).window;
});

describe('isProviderDashboardEnabled', () => {
  it('is off by default', () => {
    expect(isProviderDashboardEnabled()).toBe(false);
  });

  it('turns on with the local preview key', () => {
    window.localStorage.setItem('qaryati_provider_dashboard', '1');
    expect(isProviderDashboardEnabled()).toBe(true);
  });

  it('ignores values other than "1"', () => {
    window.localStorage.setItem('qaryati_provider_dashboard', 'yes');
    expect(isProviderDashboardEnabled()).toBe(false);
  });

  it('is off without a browser window', () => {
    delete (globalThis as Record<string, unknown>).window;
    expect(isProviderDashboardEnabled()).toBe(false);
  });
});
