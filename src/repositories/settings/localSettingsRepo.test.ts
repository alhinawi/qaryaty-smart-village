import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalSettingsRepo } from './localSettingsRepo';

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
});

describe('local settings repo (demo mode)', () => {
  beforeEach(() => storage.clear());

  it('defaults to demo mode on', async () => {
    expect(await createLocalSettingsRepo().getDemoMode()).toBe(true);
  });

  it('remembers the switch', async () => {
    const repo = createLocalSettingsRepo();
    await repo.setDemoMode(false);
    expect(await repo.getDemoMode()).toBe(false);
    await repo.setDemoMode(true);
    expect(await repo.getDemoMode()).toBe(true);
  });

  it('whatsapp notifications default to OFF and remember the switch', async () => {
    const repo = createLocalSettingsRepo();
    expect(await repo.getWhatsappEnabled()).toBe(false);
    await repo.setWhatsappEnabled(true);
    expect(await repo.getWhatsappEnabled()).toBe(true);
    await repo.setWhatsappEnabled(false);
    expect(await repo.getWhatsappEnabled()).toBe(false);
  });
});
