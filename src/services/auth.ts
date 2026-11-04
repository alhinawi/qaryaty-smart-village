// ─── Auth service
//
// ⚠️ MOCK, CLIENT-SIDE ONLY. THIS IS NOT REAL SECURITY.
// There is no backend yet, so accounts live in this browser's localStorage.
// Anyone with the device (or devtools) can read or change them, and an account
// made on one phone does not exist on another.
//
// Passwords are never stored: only a salted PBKDF2-SHA256 hash, and only so
// the demo login can check them. A real backend must hash on the server and
// should move to phone + OTP (see README "Next steps").
//
// This file holds the AuthService contract and its mock implementation.
// The app picks mock or Supabase in src/repositories/index.ts (`authRepo`);
// nothing else talks to the storage directly.

import type { AuthSession, AuthUser, UserRole } from '@/types';
import { normalizeEgyptianPhone } from '@/utils/validators';
import type { LoginInput, RegisterInput } from '@/utils/validators';
import { getBrowserStorage, readJson, writeJson, type KeyValueStorage } from './storage';

// ─── Public contract
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'phone_taken'
  | 'email_taken'
  /** Signed up but hasn't opened the activation email yet. */
  | 'email_not_confirmed'
  | 'blocked'
  | 'not_found'
  /** The backend refused the request (rate limit, bad data). */
  | 'rejected'
  /** The backend is down or paused. Nothing happened. */
  | 'unavailable';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Signed in right away, or the account needs the activation email first. */
export type RegisterResult =
  | { status: 'signed_in'; session: AuthSession }
  | { status: 'confirm_email'; email: string };

export interface AuthService {
  register(input: Omit<RegisterInput, 'confirmPassword'>): Promise<RegisterResult>;
  login(input: LoginInput): Promise<AuthSession>;
  logout(token: string): Promise<void>;
  /** Current state of a user (role/blocked may have changed). null when gone. */
  getUser(userId: string): Promise<AuthUser | null>;
  updateProfile(
    userId: string,
    data: Partial<Pick<AuthUser, 'name' | 'village' | 'address'>>
  ): Promise<AuthUser>;

  // Admin: user management
  listUsers(): Promise<AuthUser[]>;
  setBlocked(userId: string, blocked: boolean): Promise<AuthUser>;
  setRole(userId: string, role: UserRole): Promise<AuthUser>;
}

// ─── Demo accounts (SAMPLE DATA, remove when a backend exists)
/** DEMO ADMIN, for trying the control panel. Not a secret: it ships in the bundle. */
export const DEMO_ADMIN = {
  email: 'admin@qaryati.app',
  phone: '01000000000',
  password: 'admin1234',
  name: 'مدير التجربة',
} as const;

/** Sample customers so the admin users list isn't empty. They have no password and can't log in. */
const SAMPLE_CUSTOMERS: Array<Pick<AuthUser, 'name' | 'email' | 'phone' | 'village' | 'address'>> = [
  { name: 'أم أحمد عبد الرحمن', email: 'om.ahmed@example.com', phone: '01011112222', village: 'قرية البركة', address: 'شارع الجامع الكبير' },
  { name: 'حسن محمود الشافعي', email: 'hassan@example.com', phone: '01122223333', village: 'قرية البركة', address: 'جنب المدرسة الابتدائي' },
  { name: 'سارة إبراهيم علي', email: 'sara@example.com', phone: '01233334444', village: 'كفر الشيخ', address: 'عزبة النخل، بيت رقم 4' },
];

// ─── Password hashing (WebCrypto PBKDF2)
const PBKDF2_ITERATIONS = 100_000;

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return toHex(bits);
}

function randomHex(bytes: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Constant-time-ish compare so the mock doesn't teach bad habits. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─── Mock implementation
interface StoredAccount {
  user: AuthUser;
  /** Absent for sample accounts that can't log in. */
  salt?: string;
  passwordHash?: string;
}

/** Accounts keyed by email (v1 was keyed by phone). */
const USERS_KEY = 'qaryati_mock_users_v2';
const SESSIONS_KEY = 'qaryati_mock_sessions_v1';

const MESSAGES = {
  invalid: 'الإيميل أو كلمة السر مش صح',
  taken: 'الإيميل ده عنده حساب قبل كده، جرّب تسجل دخول',
  blocked: 'الحساب ده موقوف، كلم إدارة قريتي',
  notFound: 'الحساب مش موجود',
};

export function createMockAuthService(
  storage: KeyValueStorage = getBrowserStorage(),
  options: { latencyMs?: number } = {}
): AuthService {
  const latency = options.latencyMs ?? 0;
  const wait = () => (latency > 0 ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());

  let seeding: Promise<void> | null = null;

  const readAccounts = () => readJson<Record<string, StoredAccount>>(storage, USERS_KEY, {});
  const writeAccounts = (accounts: Record<string, StoredAccount>) =>
    writeJson(storage, USERS_KEY, accounts);
  const readSessions = () => readJson<Record<string, string>>(storage, SESSIONS_KEY, {});
  const writeSessions = (sessions: Record<string, string>) =>
    writeJson(storage, SESSIONS_KEY, sessions);

  function newUser(
    data: Pick<AuthUser, 'name' | 'email' | 'phone' | 'village' | 'address'>,
    role: UserRole
  ): AuthUser {
    return {
      id: `usr_${randomHex(8)}`,
      ...data,
      role,
      blocked: false,
      createdAt: new Date().toISOString(),
    };
  }

  /** Seeds the demo admin and sample customers the first time only. */
  function ensureSeeded(): Promise<void> {
    if (!seeding) {
      seeding = (async () => {
        const accounts = readAccounts();
        if (Object.keys(accounts).length > 0) return;
        const salt = randomHex(16);
        accounts[DEMO_ADMIN.email] = {
          user: newUser(
            { name: DEMO_ADMIN.name, email: DEMO_ADMIN.email, phone: DEMO_ADMIN.phone, village: 'قرية البركة', address: 'مكتب قريتي' },
            'admin'
          ),
          salt,
          passwordHash: await hashPassword(DEMO_ADMIN.password, salt),
        };
        for (const sample of SAMPLE_CUSTOMERS) {
          accounts[sample.email] = { user: newUser(sample, 'customer') };
        }
        writeAccounts(accounts);
      })();
    }
    return seeding;
  }

  function startSession(user: AuthUser): AuthSession {
    const token = `mock_${randomHex(24)}`;
    const sessions = readSessions();
    sessions[token] = user.id;
    writeSessions(sessions);
    return { token, user };
  }

  function findById(userId: string): [string, StoredAccount] | undefined {
    return Object.entries(readAccounts()).find(([, acc]) => acc.user.id === userId);
  }

  function patchUser(userId: string, patch: Partial<AuthUser>): AuthUser {
    const accounts = readAccounts();
    const entry = Object.entries(accounts).find(([, acc]) => acc.user.id === userId);
    if (!entry) throw new AuthError('not_found', MESSAGES.notFound);
    const [email, account] = entry;
    const user = { ...account.user, ...patch, id: account.user.id, email: account.user.email, phone: account.user.phone };
    accounts[email] = { ...account, user };
    writeAccounts(accounts);
    return user;
  }

  return {
    async register(input) {
      await ensureSeeded();
      await wait();
      const email = input.email.trim().toLowerCase();
      const phone = normalizeEgyptianPhone(input.phone);
      const accounts = readAccounts();
      if (accounts[email]) throw new AuthError('email_taken', MESSAGES.taken);
      const salt = randomHex(16);
      const user = newUser(
        {
          name: input.name.trim(),
          email,
          phone,
          village: input.village.trim(),
          address: input.address.trim(),
        },
        'customer'
      );
      accounts[email] = { user, salt, passwordHash: await hashPassword(input.password, salt) };
      writeAccounts(accounts);
      // The demo has no mail server: the account is active right away
      return { status: 'signed_in', session: startSession(user) };
    },

    async login(input) {
      await ensureSeeded();
      await wait();
      const account = readAccounts()[input.email.trim().toLowerCase()];
      // Same message whether the email or the password is wrong
      if (!account?.salt || !account.passwordHash) {
        throw new AuthError('invalid_credentials', MESSAGES.invalid);
      }
      const hash = await hashPassword(input.password, account.salt);
      if (!safeEqual(hash, account.passwordHash)) {
        throw new AuthError('invalid_credentials', MESSAGES.invalid);
      }
      if (account.user.blocked) throw new AuthError('blocked', MESSAGES.blocked);
      return startSession(account.user);
    },

    async logout(token) {
      const sessions = readSessions();
      delete sessions[token];
      writeSessions(sessions);
    },

    async getUser(userId) {
      await ensureSeeded();
      return findById(userId)?.[1].user ?? null;
    },

    async updateProfile(userId, data) {
      await ensureSeeded();
      const clean: Partial<AuthUser> = {};
      if (data.name !== undefined) clean.name = data.name.trim();
      if (data.village !== undefined) clean.village = data.village.trim();
      if (data.address !== undefined) clean.address = data.address.trim();
      return patchUser(userId, clean);
    },

    async listUsers() {
      await ensureSeeded();
      return Object.values(readAccounts())
        .map((acc) => acc.user)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async setBlocked(userId, blocked) {
      await ensureSeeded();
      const user = patchUser(userId, { blocked });
      if (blocked) {
        // End the blocked user's sessions on this device
        const sessions = readSessions();
        for (const [token, id] of Object.entries(sessions)) if (id === userId) delete sessions[token];
        writeSessions(sessions);
      }
      return user;
    },

    async setRole(userId, role) {
      await ensureSeeded();
      return patchUser(userId, { role });
    },
  };
}

/** Mock auth used in demo mode. The app uses `authRepo` from src/repositories. */
export const mockAuthService: AuthService = createMockAuthService(undefined, { latencyMs: 300 });
