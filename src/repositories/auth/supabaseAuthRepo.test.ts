import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError, PHONE_INVALID_MESSAGE } from '@/services/auth';
import { createSupabaseAuthRepo, mapAuthError, type ProfileRow } from './supabaseAuthRepo';

const profile: ProfileRow = {
  id: 'u1',
  name: 'أحمد',
  username: 'ahmed',
  email: 'ahmed@example.com',
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
  it('signs up with the real email and waits for the activation link', async () => {
    const signUp = vi.fn(async (_args: object) => ({ data: { user: { id: 'u9', identities: [{}] }, session: null }, error: null }));
    const rpc = vi.fn(async (_fn: string, _args: object) => ({ data: true, error: null }));
    const client = { auth: { signUp }, rpc } as unknown as SupabaseClient;
    const result = await createSupabaseAuthRepo(async () => client).register({
      name: ' أحمد ',
      username: 'Ahmed_10',
      email: ' Ahmed@Example.com ',
      phone: '+20 101 234 5678',
      village: 'البركة',
      address: 'شارع الجامع',
      password: 'qarya2026',
    });
    expect(result).toEqual({ status: 'confirm_email', email: 'ahmed@example.com' });
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ahmed@example.com',
        options: expect.objectContaining({
          data: expect.objectContaining({ phone: '01012345678', name: 'أحمد', username: 'ahmed_10' }),
        }),
      })
    );
    expect(rpc).toHaveBeenCalledWith('username_available', { wanted: 'ahmed_10' });
  });

  it('a taken username stops before the sign-up', async () => {
    const signUp = vi.fn();
    const client = { auth: { signUp }, rpc: async () => ({ data: false, error: null }) } as unknown as SupabaseClient;
    const error = await createSupabaseAuthRepo(async () => client)
      .register({ name: 'أحمد', username: 'ahmed', email: 'a@b.co', phone: '01012345678', village: 'ب', address: 'شارع الجامع', password: 'qarya2026' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('username_taken');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('a username taken during the sign-up is username_taken, not an outage', async () => {
    let calls = 0;
    const client = {
      auth: { signUp: async () => ({ data: { user: null, session: null }, error: { status: 500, message: 'Database error saving new user' } }) },
      rpc: async () => ({ data: calls++ === 0, error: null }),
    } as unknown as SupabaseClient;
    const error = await createSupabaseAuthRepo(async () => client)
      .register({ name: 'أحمد', username: 'ahmed', email: 'a@b.co', phone: '01012345678', village: 'ب', address: 'شارع الجامع', password: 'qarya2026' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('username_taken');
  });

  it('an email that already has an account is email_taken', async () => {
    const client = {
      auth: { signUp: async () => ({ data: { user: { id: 'u9', identities: [] }, session: null }, error: null }) },
      rpc: async () => ({ data: true, error: null }),
    } as unknown as SupabaseClient;
    const error = await createSupabaseAuthRepo(async () => client)
      .register({ name: 'أحمد', username: 'ahmed', email: 'a@b.co', phone: '01012345678', village: 'ب', address: 'شارع الجامع', password: 'qarya2026' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('email_taken');
  });

  it('maps real answers to AuthError and leaves outages alone', () => {
    expect((mapAuthError({ status: 400, code: 'invalid_credentials' }) as AuthError).code).toBe('invalid_credentials');
    expect((mapAuthError({ status: 422, code: 'user_already_exists' }) as AuthError).code).toBe('email_taken');
    expect((mapAuthError({ status: 400, code: 'email_not_confirmed' }) as AuthError).code).toBe('email_not_confirmed');
    expect((mapAuthError({ status: 429, code: 'over_request_rate_limit' }) as AuthError).code).toBe('rejected');
    expect((mapAuthError({ status: 429, code: 'over_email_send_rate_limit' }) as AuthError).message).toContain('إيميل التفعيل');
    expect((mapAuthError({ status: 400, code: 'email_address_invalid' }) as AuthError).message).toContain('الإيميل');
    expect((mapAuthError({ status: 422, code: 'weak_password' }) as AuthError).message).toContain('كلمة السر');
    const outage = { status: 503, message: 'project paused' };
    expect(mapAuthError(outage)).toBe(outage);
    expect(mapAuthError({ message: 'Failed to fetch' })).not.toBeInstanceOf(AuthError);
  });

  it('logs in and returns the profile', async () => {
    const { client } = fakeClient({ profile });
    const session = await createSupabaseAuthRepo(async () => client).login({ email: 'ahmed@example.com', password: 'x' });
    expect(session).toEqual({ token: 'tok', user: expect.objectContaining({ id: 'u1', name: 'أحمد' }) });
  });

  it('refuses a blocked account and signs it out', async () => {
    const { client, signOut } = fakeClient({ profile: { ...profile, blocked: true } });
    const error = await createSupabaseAuthRepo(async () => client)
      .login({ email: 'ahmed@example.com', password: 'x' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('blocked');
    expect(signOut).toHaveBeenCalled();
  });

  it('wrong password is a normal AuthError', async () => {
    const { client } = fakeClient({ signInError: { status: 400, code: 'invalid_credentials', message: 'Invalid' } });
    const error = await createSupabaseAuthRepo(async () => client)
      .login({ email: 'ahmed@example.com', password: 'x' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('invalid_credentials');
  });

  it('changes role and blocked only through the admin functions', async () => {
    const rpc = vi.fn(async (_fn: string, _args: object) => ({ data: { ...profile, role: 'admin' }, error: null }));
    const update = vi.fn();
    const client = { rpc, from: () => ({ update }) } as unknown as SupabaseClient;
    const repo = createSupabaseAuthRepo(async () => client);

    const user = await repo.setRole('u1', 'admin');
    expect(rpc).toHaveBeenCalledWith('admin_set_role', { target: 'u1', new_role: 'admin' });
    expect(user.role).toBe('admin');

    await repo.setBlocked('u1', true);
    expect(rpc).toHaveBeenCalledWith('admin_set_blocked', { target: 'u1', new_blocked: true });
    expect(update).not.toHaveBeenCalled();
  });

  it('a refused admin call is a normal AuthError', async () => {
    const client = {
      rpc: async () => ({ data: null, error: { code: '42501', message: 'not allowed' } }),
    } as unknown as SupabaseClient;
    const error = await createSupabaseAuthRepo(async () => client)
      .setRole('u2', 'admin')
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('rejected');
  });

  it('a profile edit sends only name, village and address', async () => {
    const update = vi.fn((_patch: object) => ({
      eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }),
    }));
    const client = { from: () => ({ update }) } as unknown as SupabaseClient;
    await createSupabaseAuthRepo(async () => client).updateProfile('u1', {
      name: ' أحمد ',
      village: 'البركة',
      address: 'شارع الجامع',
      ...({ role: 'admin', blocked: false } as object),
    });
    expect(update).toHaveBeenCalledWith({ name: 'أحمد', village: 'البركة', address: 'شارع الجامع' });
  });
  it('a new phone goes through update_my_phone, never the profile update', async () => {
    const rpc = vi.fn(async (_fn: string, _args: object) => ({ data: { ...profile, phone: '01198765432' }, error: null }));
    const update = vi.fn((_patch: object) => ({
      eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: { ...profile, phone: '01198765432', name: 'أحمد علي' }, error: null }) }) }),
    }));
    const client = { rpc, from: () => ({ update }) } as unknown as SupabaseClient;
    const user = await createSupabaseAuthRepo(async () => client).updateProfile('u1', { name: 'أحمد علي', phone: '+20 119 876 5432' });
    expect(rpc).toHaveBeenCalledWith('update_my_phone', { p_phone: '01198765432' });
    expect(update).toHaveBeenCalledWith({ name: 'أحمد علي' });
    expect(user.phone).toBe('01198765432');
    expect(user.name).toBe('أحمد علي');
  });

  it('only the phone: one call, no empty profile update', async () => {
    const rpc = vi.fn(async (_fn: string, _args: object) => ({ data: { ...profile, phone: '01598765432' }, error: null }));
    const update = vi.fn();
    const client = { rpc, from: () => ({ update }) } as unknown as SupabaseClient;
    const user = await createSupabaseAuthRepo(async () => client).updateProfile('u1', { phone: '01598765432' });
    expect(update).not.toHaveBeenCalled();
    expect(user.phone).toBe('01598765432');
  });

  it('a phone the server refuses stops the save with a clear Arabic message', async () => {
    const update = vi.fn();
    const client = {
      rpc: async () => ({ data: null, error: { code: '22023', message: 'profile:bad_phone' } }),
      from: () => ({ update }),
    } as unknown as SupabaseClient;
    const error = await createSupabaseAuthRepo(async () => client)
      .updateProfile('u1', { name: 'أحمد', phone: '0123' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).message).toBe(PHONE_INVALID_MESSAGE);
    expect(update).not.toHaveBeenCalled();
  });

  it('a blocked account trying to change its phone gets the blocked message', async () => {
    const client = {
      rpc: async () => ({ data: null, error: { code: '42501', message: 'profile:blocked' } }),
    } as unknown as SupabaseClient;
    const error = await createSupabaseAuthRepo(async () => client)
      .updateProfile('u1', { phone: '01012345679' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('blocked');
  });
});
