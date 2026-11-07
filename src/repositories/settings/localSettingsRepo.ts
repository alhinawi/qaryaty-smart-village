// ─── Demo mode on this device (demo backend)
import type { SettingsRepo } from './types';

const KEY = 'qaryati_demo_mode';
const WA_KEY = 'qaryati_whatsapp_enabled';

export function createLocalSettingsRepo(): SettingsRepo {
  return {
    async getAppearanceEnabled() { try { return localStorage.getItem('qaryati_appearance_enabled') !== '0'; } catch { return false; } },
    async setAppearanceEnabled(on) { localStorage.setItem('qaryati_appearance_enabled', on ? '1' : '0'); },
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
