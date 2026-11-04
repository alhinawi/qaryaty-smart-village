// ─── Auth on Supabase (email + password)
//
// The customer signs up with their real email. With "Confirm email" on in the
// Supabase dashboard, Supabase sends the activation email (from the site's own
// SMTP sender) and the account can sign in only after the link is opened.
//
// Profile data (name, phone, village, role, blocked) lives in the `profiles`
// table, filled by a database trigger on sign-up.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser, UserRole } from '@/types';
import { normalizeEgyptianPhone } from '@/utils/validators';
import { AuthError, type AuthService } from '@/services/auth';

export interface ProfileRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  village: string;
  address: string;
  role: UserRole;
  blocked: boolean;
  created_at: string;
}

/** Profile columns a customer may change; role, blocked and phone are not among them. */
type EditableColumn = 'name' | 'village' | 'address';

export function userFromProfile(row: ProfileRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? '',
    phone: row.phone,
    village: row.village,
    address: row.address,
    role: row.role,
    blocked: row.blocked,
    createdAt: row.created_at,
  };
}

const MESSAGES = {
  invalid: 'الإيميل أو كلمة السر مش صح',
  taken: 'الإيميل ده عنده حساب قبل كده، جرّب تسجل دخول',
  notConfirmed: 'لسه مافعّلتش حسابك. افتح إيميل التفعيل اللي بعتناهولك واضغط على اللينك',
  blocked: 'الحساب ده موقوف، كلم إدارة قريتي',
  notFound: 'الحساب مش موجود',
  tooMany: 'محاولات كتير، استنى شوية وجرّب تاني',
  rejected: 'الطلب اترفض، راجع البيانات وجرّب تاني',
};

interface ErrorLike {
  status?: number;
  code?: string;
  message?: string;
}

/**
 * Turns a Supabase Auth error into an AuthError when it is a real answer
 * (wrong password, phone taken). Server and network errors are returned as
 * they are, so the resilience wrapper reports "الخدمة متوقفة مؤقتًا".
 */
export function mapAuthError(error: ErrorLike): unknown {
  const code = error.code ?? '';
  const status = error.status ?? 0;
  if (code === 'invalid_credentials') return new AuthError('invalid_credentials', MESSAGES.invalid);
  if (code === 'email_not_confirmed') return new AuthError('email_not_confirmed', MESSAGES.notConfirmed);
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(error.message ?? '')) {
    return new AuthError('email_taken', MESSAGES.taken);
  }
  if (code === 'user_banned') return new AuthError('blocked', MESSAGES.blocked);
  if (status === 429) return new AuthError('rejected', MESSAGES.tooMany);
  if (status >= 400 && status < 500) return new AuthError('rejected', MESSAGES.rejected);
  return error; // 5xx, paused project, offline
}

/** Postgres refused (permission, bad data): a real answer, not an outage. */
function mapDbError(error: ErrorLike): unknown {
  if (error.code && /^(22|23|42)/.test(error.code)) return new AuthError('rejected', MESSAGES.rejected);
  return error;
}

/** Where the link in the activation email lands: this site's login page. */
function activationRedirect(): string | undefined {
  return typeof window === 'undefined' ? undefined : `${window.location.origin}/login?activated=1`;
}

export function createSupabaseAuthRepo(getClient: () => Promise<SupabaseClient>): AuthService {
  async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw mapDbError(error);
    return data ? userFromProfile(data as ProfileRow) : null;
  }

  /** The app may change only these columns (see the grants in supabase/schema.sql). */
  async function updateProfileRow(userId: string, patch: Partial<Pick<ProfileRow, EditableColumn>>): Promise<AuthUser> {
    const supabase = await getClient();
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().maybeSingle();
    if (error) throw mapDbError(error);
    if (!data) throw new AuthError('not_found', MESSAGES.notFound);
    return userFromProfile(data as ProfileRow);
  }

  async function adminRpc(fn: 'admin_set_role' | 'admin_set_blocked', args: Record<string, unknown>): Promise<AuthUser> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc(fn, args);
    if (error) throw mapDbError(error);
    const row = data as ProfileRow | null;
    if (!row?.id) throw new AuthError('not_found', MESSAGES.notFound);
    return userFromProfile(row);
  }

  return {
    async register(input) {
      const supabase = await getClient();
      const email = input.email.trim().toLowerCase();
      const meta = {
        name: input.name.trim(),
        phone: normalizeEgyptianPhone(input.phone),
        village: input.village.trim(),
        address: input.address.trim(),
      };
      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: { data: meta, emailRedirectTo: activationRedirect() },
      });
      if (error) throw mapAuthError(error);
      // With confirmation on, Supabase answers an existing email with a user that has no identities
      if (data.user && data.user.identities?.length === 0) throw new AuthError('email_taken', MESSAGES.taken);
      if (!data.session || !data.user) return { status: 'confirm_email', email };
      const user =
        (await fetchProfile(supabase, data.user.id)) ??
        // The trigger hasn't run yet: use what we just sent
        { id: data.user.id, email, ...meta, role: 'customer' as const, blocked: false, createdAt: data.user.created_at };
      return { status: 'signed_in', session: { token: data.session.access_token, user } };
    },

    async login(input) {
      const supabase = await getClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      });
      if (error) throw mapAuthError(error);
      const user = await fetchProfile(supabase, data.user.id);
      if (!user) {
        await supabase.auth.signOut();
        throw new AuthError('not_found', MESSAGES.notFound);
      }
      if (user.blocked) {
        await supabase.auth.signOut();
        throw new AuthError('blocked', MESSAGES.blocked);
      }
      return { token: data.session.access_token, user };
    },

    async logout() {
      const supabase = await getClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw mapAuthError(error);
    },

    async getUser(userId) {
      return fetchProfile(await getClient(), userId);
    },

    async updateProfile(userId, data) {
      const patch: Partial<Pick<ProfileRow, EditableColumn>> = {};
      if (data.name !== undefined) patch.name = data.name.trim();
      if (data.village !== undefined) patch.village = data.village.trim();
      if (data.address !== undefined) patch.address = data.address.trim();
      return updateProfileRow(userId, patch);
    },

    async listUsers() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw mapDbError(error);
      return (data as ProfileRow[]).map(userFromProfile);
    },

    // role and blocked can't be updated from the app (column privileges); only
    // these admin functions in the database may change them, after checking the caller.
    setBlocked: (userId, blocked) => adminRpc('admin_set_blocked', { target: userId, new_blocked: blocked }),
    setRole: (userId, role) => adminRpc('admin_set_role', { target: userId, new_role: role }),
  };
}
