import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@/types';

const saved: AuthUser = {
  id: 'u1',
  name: 'أحمد',
  username: 'ahmed',
  email: 'ahmed@example.com',
  phone: '01198765432',
  village: 'البركة',
  address: 'شارع الجامع',
  role: 'customer',
  blocked: false,
  createdAt: '2026-11-04T00:00:00Z',
};

const updateProfile = vi.fn(async (_id: string, _data: object) => saved);

vi.mock('@/repositories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/repositories')>();
  return {
    ...actual,
    authRepo: { ...actual.authRepo, updateProfile: (id: string, data: object) => updateProfile(id, data) },
  };
});

describe('updateUser', () => {
  it('a new phone reaches the session and the profile the order and listing forms prefill from', async () => {
    const { useAuthStore } = await import('./useAuthStore');
    const { useUserStore } = await import('./useUserStore');
    useAuthStore.setState({ session: { token: 't', user: { ...saved, phone: '01012345678' } } });
    useUserStore.getState().applyAuthUser({ ...saved, phone: '01012345678' });

    await useAuthStore.getState().updateUser({ phone: '01198765432' });

    expect(updateProfile).toHaveBeenCalledWith('u1', { phone: '01198765432' });
    expect(useAuthStore.getState().session?.user.phone).toBe('01198765432');
    expect(useUserStore.getState().profile.phone).toBe('01198765432');
  });
});
