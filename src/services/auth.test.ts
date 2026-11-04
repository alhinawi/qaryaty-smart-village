import { beforeEach, describe, expect, it } from 'vitest';
import { AuthError, DEMO_ADMIN, createMockAuthService, type AuthService } from './auth';
import { createMemoryStorage, type KeyValueStorage } from './storage';
import { loginSchema, registerSchema } from '@/utils/validators';

const newAccount = {
  name: 'محمد الهناوي',
  phone: '٠١٠١٢٣٤٥٦٧٨',
  village: 'قرية البركة',
  address: 'شارع المدرسة',
  password: 'qarya2026',
};

describe('mock auth service', () => {
  let storage: KeyValueStorage;
  let auth: AuthService;

  beforeEach(() => {
    storage = createMemoryStorage();
    auth = createMockAuthService(storage);
  });

  it('registers with a normalized phone and logs in with +20', async () => {
    const session = await auth.register(newAccount);
    expect(session.user.phone).toBe('01012345678');
    expect(session.user.role).toBe('customer');
    const again = await auth.login({ phone: '+20 101 234 5678', password: 'qarya2026' });
    expect(again.user.id).toBe(session.user.id);
  });

  it('never stores the plain password', async () => {
    await auth.register(newAccount);
    const raw = storage.getItem('qaryati_mock_users_v1') ?? '';
    expect(raw).not.toContain('qarya2026');
    expect(raw).not.toContain(DEMO_ADMIN.password);
    expect(raw).toMatch(/"passwordHash":"[0-9a-f]{64}"/);
  });

  it('rejects a wrong password and an unknown phone with the same error', async () => {
    await auth.register(newAccount);
    const wrong = auth.login({ phone: '01012345678', password: 'nope12345' });
    await expect(wrong).rejects.toMatchObject({ code: 'invalid_credentials' });
    const unknown = auth.login({ phone: '01099999999', password: 'qarya2026' });
    await expect(unknown).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('refuses a second account on the same phone', async () => {
    await auth.register(newAccount);
    await expect(auth.register({ ...newAccount, phone: '01012345678' })).rejects.toBeInstanceOf(AuthError);
  });

  it('seeds the demo admin, who can log in', async () => {
    const session = await auth.login({ phone: DEMO_ADMIN.phone, password: DEMO_ADMIN.password });
    expect(session.user.role).toBe('admin');
  });

  it('sample customers cannot log in', async () => {
    const users = await auth.listUsers();
    const sample = users.find((u) => u.role === 'customer');
    expect(sample).toBeDefined();
    await expect(auth.login({ phone: sample!.phone, password: 'anything1' })).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
  });

  it('blocked users cannot log in; role changes stick', async () => {
    const { user } = await auth.register(newAccount);
    await auth.setBlocked(user.id, true);
    await expect(auth.login({ phone: user.phone, password: 'qarya2026' })).rejects.toMatchObject({ code: 'blocked' });
    await auth.setBlocked(user.id, false);
    await auth.setRole(user.id, 'admin');
    expect((await auth.getUser(user.id))?.role).toBe('admin');
  });
});

describe('auth form schemas', () => {
  const valid = { ...newAccount, confirmPassword: newAccount.password };

  it('accepts a valid registration and normalizes the phone', () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe('01012345678');
  });

  it.each([
    ['short password', { password: 'ab1', confirmPassword: 'ab1' }, 'password'],
    ['password without digits', { password: 'abcdefgh', confirmPassword: 'abcdefgh' }, 'password'],
    ['password without letters', { password: '12345678', confirmPassword: '12345678' }, 'password'],
    ['mismatched confirmation', { confirmPassword: 'other1234' }, 'confirmPassword'],
    ['short name', { name: 'م' }, 'name'],
    ['bad phone', { phone: '0123' }, 'phone'],
    ['short address', { address: 'بيت' }, 'address'],
  ])('rejects %s', (_label, patch, field) => {
    const r = registerSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0])).toContain(field);
  });

  it('login needs a valid phone and a password', () => {
    expect(loginSchema.safeParse({ phone: '+201012345678', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ phone: '01012345678', password: '' }).success).toBe(false);
  });
});
