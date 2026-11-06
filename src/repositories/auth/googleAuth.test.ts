import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError, needsProfileCompletion } from '@/services/auth';
import { oauthErrorFrom } from '@/pages/Auth/oauthError';
import { createSupabaseAuthRepo, mapAuthError, type ProfileRow } from './supabaseAuthRepo';

const googleProfile: ProfileRow = {
  id: 'g1',
  name: 'Mohamed Test',
  username: null as unknown as string,
  email: 'm@gmail.com',
  phone: '',
  village: '',
  address: '',
  role: 'customer',
  blocked: false,
  created_at: '2026-11-06T00:00:00Z',
};

function clientWith(auth: object, extra: object = {}, profile: ProfileRow | null = googleProfile) {
  return {
    auth: { signOut: vi.fn(async () => ({ error: null })), ...auth },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) }),
    ...extra,
  } as unknown as SupabaseClient;
}

describe('google sign-in', () => {
  it('the button shows only when the google provider is on', async () => {
    const on = createSupabaseAuthRepo(async () => clientWith({}), { fetchSettings: async () => ({ external: { google: true } }) });
    const off = createSupabaseAuthRepo(async () => clientWith({}), { fetchSettings: async () => ({ external: { google: false, email: true } }) });
    const broken = createSupabaseAuthRepo(async () => clientWith({}), {
      fetchSettings: async () => {
        throw new Error('offline');
      },
    });
    expect(await on.isGoogleEnabled()).toBe(true);
    expect(await off.isGoogleEnabled()).toBe(false);
    expect(await broken.isGoogleEnabled()).toBe(false);
  });

  it('sends the browser to google with the callback page', async () => {
    const signInWithOAuth = vi.fn(async (_args: object) => ({ data: {}, error: null }));
    await createSupabaseAuthRepo(async () => clientWith({ signInWithOAuth })).signInWithGoogle('https://qaryaty.vercel.app/auth/callback');
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://qaryaty.vercel.app/auth/callback' },
    });
  });

  it('a provider that is off reads as a friendly message', () => {
    const err = mapAuthError({ message: 'Unsupported provider: provider is not enabled', code: 'validation_failed' } as never);
    expect(err).toBeInstanceOf(AuthError);
    expect((err as AuthError).message).toContain('جوجل');
  });

  it('picks up the session google left and loads the profile', async () => {
    const getSession = async () => ({ data: { session: { access_token: 'tok', user: { id: 'g1' } } }, error: null });
    const session = await createSupabaseAuthRepo(async () => clientWith({ getSession })).restoreSession();
    expect(session?.token).toBe('tok');
    expect(session?.user.username).toBe('');
    expect(needsProfileCompletion(session!.user)).toBe(true);
  });

  it('no session after the redirect gives null', async () => {
    const getSession = async () => ({ data: { session: null }, error: null });
    expect(await createSupabaseAuthRepo(async () => clientWith({ getSession })).restoreSession()).toBeNull();
  });

  it('completes the profile through complete_profile with clean values', async () => {
    const rpc = vi.fn(async (_fn: string, _args: object) => ({
      data: { ...googleProfile, username: 'mo_10', phone: '01012345678', village: 'البركة', address: 'شارع المدرسة' },
      error: null,
    }));
    const user = await createSupabaseAuthRepo(async () => clientWith({}, { rpc })).completeProfile('g1', {
      name: ' محمد ',
      username: 'Mo_10',
      phone: '+20 101 234 5678',
      village: 'البركة ',
      address: 'شارع المدرسة',
    });
    expect(rpc).toHaveBeenCalledWith('complete_profile', {
      p_name: 'محمد',
      p_username: 'mo_10',
      p_phone: '01012345678',
      p_village: 'البركة',
      p_address: 'شارع المدرسة',
    });
    expect(needsProfileCompletion(user)).toBe(false);
  });

  it('a username taken meanwhile reads as username_taken', async () => {
    const rpc = async () => ({ data: null, error: { code: '23505', message: 'duplicate key' } });
    const error = await createSupabaseAuthRepo(async () => clientWith({}, { rpc }))
      .completeProfile('g1', { name: 'محمد', username: 'ahmed', phone: '01012345678', village: 'ب', address: '' })
      .catch((e: unknown) => e);
    expect((error as AuthError).code).toBe('username_taken');
  });

  it('reads the error google puts in the address bar', () => {
    expect(oauthErrorFrom('?error=access_denied', '')).toContain('لغيت');
    expect(oauthErrorFrom('', '#error=server_error&error_description=Database+error+saving+new+user')).toContain('ماقدرناش');
    expect(oauthErrorFrom('?error=invalid_request&error_description=Unsupported+provider%3A+provider+is+not+enabled', '')).toContain('لسه مش متاح');
    expect(oauthErrorFrom('', '#access_token=abc')).toBe('');
  });

  it('an account with phone, village and address needs nothing more before ordering', () => {
    expect(needsProfileCompletion({ phone: '01012345678', village: 'البركة', address: 'شارع المدرسة' })).toBe(false);
    // The username is made from the email, so it never blocks an order
    expect(needsProfileCompletion({ phone: '01012345678', village: 'البركة', address: ' ' })).toBe(true);
    expect(needsProfileCompletion({ phone: '', village: 'البركة', address: 'شارع المدرسة' })).toBe(true);
    expect(needsProfileCompletion({ phone: '01012345678', village: '', address: 'شارع المدرسة' })).toBe(true);
  });
});
