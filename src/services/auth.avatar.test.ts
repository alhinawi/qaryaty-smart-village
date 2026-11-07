import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_ADMIN, mockAuthService } from './auth';

// The mock auth service keeps accounts in localStorage; node has none, so stub it
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
});

describe('mock auth setAvatar', () => {
  beforeEach(() => {
    storage.clear();
  });

  const login = async () => {
    const session = await mockAuthService.login({ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password });
    return session.user;
  };

  it('sets the photo as a data URL and returns the updated user', async () => {
    const user = await login();
    const blob = new Blob(['fake-jpeg'], { type: 'image/jpeg' });
    const updated = await mockAuthService.setAvatar(user.id, blob);
    expect(updated.avatarUrl).toMatch(/^data:image\/jpeg;base64,/);
    const reread = await mockAuthService.getUser(user.id);
    expect(reread?.avatarUrl).toBe(updated.avatarUrl);
  });

  it('clears the photo with null', async () => {
    const user = await login();
    await mockAuthService.setAvatar(user.id, new Blob(['x'], { type: 'image/png' }));
    const cleared = await mockAuthService.setAvatar(user.id, null);
    expect(cleared.avatarUrl).toBe('');
    const reread = await mockAuthService.getUser(user.id);
    expect(reread?.avatarUrl ?? '').toBe('');
  });

  it('rejects an unknown user', async () => {
    await expect(mockAuthService.setAvatar('nobody', null)).rejects.toThrow();
  });
});
