import { beforeEach, describe, expect, it } from 'vitest';
import { AuthError, DEMO_ADMIN, PHONE_INVALID_MESSAGE, createMockAuthService, type AuthService } from './auth';
import { createMemoryStorage, type KeyValueStorage } from './storage';
import { loginSchema, registerSchema } from '@/utils/validators';

const newAccount = {
  name: 'محمد الهناوي',
  username: '@Hinawi_1',
  email: 'Hinawi@Example.com',
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

  it('registers with a normalized phone and logs in with the email', async () => {
    const result = await auth.register(newAccount);
    if (result.status !== 'signed_in') throw new Error('expected a session');
    const { session } = result;
    expect(session.user.phone).toBe('01012345678');
    expect(session.user.email).toBe('hinawi@example.com');
    expect(session.user.role).toBe('customer');
    expect(session.user.username).toBe('hinawi_1');
    const again = await auth.login({ email: ' hinawi@EXAMPLE.com ', password: 'qarya2026' });
    expect(again.user.id).toBe(session.user.id);
  });

  it('never stores the plain password', async () => {
    await auth.register(newAccount);
    const raw = storage.getItem('qaryati_mock_users_v2') ?? '';
    expect(raw).not.toContain('qarya2026');
    expect(raw).not.toContain(DEMO_ADMIN.password);
    expect(raw).toMatch(/"passwordHash":"[0-9a-f]{64}"/);
  });

  it('rejects a wrong password and an unknown email with the same error', async () => {
    await auth.register(newAccount);
    const wrong = auth.login({ email: 'hinawi@example.com', password: 'nope12345' });
    await expect(wrong).rejects.toMatchObject({ code: 'invalid_credentials' });
    const unknown = auth.login({ email: 'nobody@example.com', password: 'qarya2026' });
    await expect(unknown).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('refuses a second account on the same email', async () => {
    await auth.register(newAccount);
    await expect(auth.register({ ...newAccount, username: 'other_name', email: 'hinawi@example.com' })).rejects.toMatchObject({
      code: 'email_taken',
    });
  });

  it('refuses a username someone already has, whatever the case', async () => {
    expect(await auth.isUsernameAvailable('hinawi_1')).toBe(true);
    await auth.register(newAccount);
    expect(await auth.isUsernameAvailable('HINAWI_1')).toBe(false);
    const second = auth.register({ ...newAccount, username: 'Hinawi_1', email: 'second@example.com' });
    await expect(second).rejects.toBeInstanceOf(AuthError);
    await expect(second).rejects.toMatchObject({ code: 'username_taken' });
    expect(await auth.isUsernameAvailable(DEMO_ADMIN.username)).toBe(false);
  });

  it('accounts saved before usernames read back with an empty one', async () => {
    const old = { 'old@example.com': { user: { id: 'usr_old', name: 'قديم', email: 'old@example.com', phone: '01012345678', village: 'ب', address: 'شارع', role: 'customer', blocked: false, createdAt: '2026-01-01T00:00:00Z' } } };
    storage.setItem('qaryati_mock_users_v2', JSON.stringify(old));
    expect((await auth.getUser('usr_old'))?.username).toBe('');
  });

  it('seeds the demo owner, who can log in', async () => {
    const session = await auth.login({ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password });
    expect(session.user.role).toBe('owner');
  });

  it('seeds a sample supervisor for each staff tier', async () => {
    const users = await auth.listUsers();
    expect(users.some((u) => u.role === 'content_admin')).toBe(true);
    expect(users.some((u) => u.role === 'orders_admin')).toBe(true);
  });

  it('sample customers cannot log in', async () => {
    const users = await auth.listUsers();
    const sample = users.find((u) => u.role === 'customer');
    expect(sample).toBeDefined();
    await expect(auth.login({ email: sample!.email, password: 'anything1' })).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
  });

  it('blocked users cannot log in; role changes stick', async () => {
    const result = await auth.register(newAccount);
    if (result.status !== 'signed_in') throw new Error('expected a session');
    const { user } = result.session;
    await auth.setBlocked(user.id, true);
    await expect(auth.login({ email: user.email, password: 'qarya2026' })).rejects.toMatchObject({ code: 'blocked' });
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
    if (r.success) expect(r.data.username).toBe('hinawi_1');
  });

  it.each([
    ['short password', { password: 'ab1', confirmPassword: 'ab1' }, 'password'],
    ['password without digits', { password: 'abcdefgh', confirmPassword: 'abcdefgh' }, 'password'],
    ['password without letters', { password: '12345678', confirmPassword: '12345678' }, 'password'],
    ['mismatched confirmation', { confirmPassword: 'other1234' }, 'confirmPassword'],
    ['short name', { name: 'م' }, 'name'],
    ['bad phone', { phone: '0123' }, 'phone'],
    ['bad email', { email: 'not-an-email' }, 'email'],
    ['short address', { address: 'بيت' }, 'address'],
    ['missing username', { username: '' }, 'username'],
    ['Arabic username', { username: 'محمد' }, 'username'],
  ])('rejects %s', (_label, patch, field) => {
    const r = registerSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0])).toContain(field);
  });

  it('login needs a valid email and a password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: '01012345678', password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('usernameFromEmail (Google accounts get one made for them)', () => {
  it('uses the part before @ in the username rules', async () => {
    const { usernameFromEmail } = await import('./auth');
    expect(usernameFromEmail('Ahmed.Ali@gmail.com', () => false)).toBe('ahmed_ali');
    expect(usernameFromEmail('12@gmail.com', () => false)).toBe('user12');
    expect(usernameFromEmail('admin@gmail.com', () => false)).toMatch(/^admin_\d{4}$/);
    expect(usernameFromEmail('mo10@gmail.com', (n) => n === 'mo10')).toMatch(/^mo10_\d{4}$/);
  });
});

describe('mock auth: phone from the profile form', () => {
  let auth: AuthService;
  beforeEach(() => {
    auth = createMockAuthService(createMemoryStorage());
  });

  it('changes the phone from the profile form, normalized and checked', async () => {
    const result = await auth.register(newAccount);
    if (result.status !== 'signed_in') throw new Error('expected a session');
    const { user } = result.session;
    const updated = await auth.updateProfile(user.id, { phone: '٠١١ ٩٨٧٦ ٥٤٣٢' });
    expect(updated.phone).toBe('01198765432');
    expect((await auth.getUser(user.id))?.phone).toBe('01198765432');
    await expect(auth.updateProfile(user.id, { phone: '0123' })).rejects.toMatchObject({ message: PHONE_INVALID_MESSAGE });
    expect((await auth.getUser(user.id))?.phone).toBe('01198765432');
    // Other fields alone leave the phone as it is
    expect((await auth.updateProfile(user.id, { name: 'محمد' })).phone).toBe('01198765432');
  });
});
