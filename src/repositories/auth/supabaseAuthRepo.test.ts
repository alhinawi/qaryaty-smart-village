import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError } from '@/services/auth';
import { createSupabaseAuthRepo, mapAuthError, phoneToEmail, type ProfileRow } from './supabaseAuthRepo';

const profile: ProfileRow = {
  id: 'u1',
  name: 'أحمد',
  phone: '01012345678',
  village: 'البركة',
  address: 'شارع الجامع',
  role: 'customer',
  blocked: false,
  created_at: '2026-11-04T00:00:00Z',
};

function fakeClient(opts: { signInError?: object; profile?: ProfileRow | null }) {
  const signOut = vi.fn(async () => ({ error: null }));
  const client = {
    auth: {
      signInWithPassword: async () =>
        opts.signInError
          ? { data: { user: null, session: null }, error: opts.signInError }
          : { data: { user: { id: 'u1' }, session: { access_token: 'tok' } }, error: null },
      signOut,
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: opts.profile ?? null, error: null }) }),
      }),
    }),
  } as unknown as SupabaseClient;
  return { client, signOut };
}

describe('supabase auth repo', () => {
  it('turns the phone into the internal sign-in address', () => {
    expect(phoneToEmail('+20 101 234 5678')).toBe('01012345678@phone.qaryati.app');
  });

  it('maps real answers to AuthError and leaves outages alone', () => {
    expect((mapAuthError({ status: 400, code: 'invalid_credentials' }) as AuthError).code).toBe('invalid_credentials');
    expect((mapAuthError({ status: 422, code: 'user_already_exists' }) as AuthError).code).toBe('phone_taken');
    expect((mapAuthError({ status: 429, code: 'over_request_rate_limit' }) as AuthError).code).toBe('rejected');
    const outage = { status: 503, message: 'project paused' };
    expect(mapAuthError(outage)).toBe(outage);
    expect(mapAuthError({ message: 'Failed to fetch' })).not.toBeInstanceOf(AuthError);
  });

  it('logs in and returns the profile', async () => {
    const { client } = fakeClient({ profile });
    const session = await createSupabaseAuthRepo(async () => client).login({ phone: '01012345678', password: 'x' });
    expect(session).toEqual({ token: 'tok', user: expect.objectContaining({ id: 'u1', name: 'أحمد' }) });
  });

  it('refuses a blocked account and signs it out', async () => {
    const { client, signOut } = fakeClient({ profile: { ...profile, blocked: true } });
    const error = await createSupabaseAuthRepo(async () => client)
      .login({ phone: '01012345678', password: 'x' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('blocked');
    expect(signOut).toHaveBeenCalled();
  });

  it('wrong password is a normal AuthError', async () => {
    const { client } = fakeClient({ signInError: { status: 400, code: 'invalid_credentials', message: 'Invalid' } });
    const error = await createSupabaseAuthRepo(async () => client)
      .login({ phone: '01012345678', password: 'x' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('invalid_credentials');
  });
});
