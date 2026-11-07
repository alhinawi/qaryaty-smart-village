// ─── Demo mode on this device (demo backend)
import type { SettingsRepo } from './types';

const KEY = 'qaryati_demo_mode';

export function createLocalSettingsRepo(): SettingsRepo {
  return {
    async getDemoMode() {
      try {
        return localStorage.getItem(KEY) !== '0';
      } catch {
        return true;
      }
    },
    async setDemoMode(on) {
      try {
        localStorage.setItem(KEY, on ? '1' : '0');
      } catch {
        /* private mode: the flag just stays in memory */
      }
    },
  };
}
