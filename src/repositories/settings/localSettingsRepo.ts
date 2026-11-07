// ─── Demo mode on this device (demo backend)
import type { SettingsRepo } from './types';

const KEY = 'qaryati_demo_mode';
const WA_KEY = 'qaryati_whatsapp_enabled';

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
    async getWhatsappEnabled() {
      try {
        return localStorage.getItem(WA_KEY) === '1';
      } catch {
        return false;
      }
    },
    async setWhatsappEnabled(on) {
      try {
        localStorage.setItem(WA_KEY, on ? '1' : '0');
      } catch {
        /* private mode: the flag just stays in memory */
      }
    },
  };
}
