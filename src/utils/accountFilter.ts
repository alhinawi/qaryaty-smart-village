// ─── Account picker filtering
// The admin links shops/providers to user accounts. With hundreds of accounts
// a plain select is unusable, so the picker searches name, email, phone and
// username with the same Arabic-aware matching as the global search.

import type { AuthUser } from '@/types';
import { matchesSearch } from './arabicSearch';

/** Accounts matching the query (Arabic- and case-insensitive). Empty query returns all. */
export function filterAccounts(users: AuthUser[], query: string): AuthUser[] {
  const q = query.trim();
  if (!q) return users;
  return users.filter((u) => matchesSearch(q, [u.name, u.email, u.phone, u.username]));
}
