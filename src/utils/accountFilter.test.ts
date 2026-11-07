import { describe, expect, it } from 'vitest';
import { filterAccounts } from './accountFilter';
import type { AuthUser } from '@/types';

const makeUser = (over: Partial<AuthUser>): AuthUser => ({
  id: 'u1',
  name: '',
  username: '',
  email: '',
  phone: '',
  village: '',
  address: '',
  role: 'customer',
  blocked: false,
  createdAt: '2026-01-01',
  ...over,
});

const users: AuthUser[] = [
  makeUser({ id: 'u1', name: 'Mohamed Alhinawi', email: 'alhinaawi@gmail.com', phone: '01028928248' }),
  makeUser({ id: 'u2', name: 'Amr Atef', email: 'amr3atef2001@gmail.com', phone: '01000000002' }),
  makeUser({ id: 'u3', name: 'أحمد محمود', email: 'ahmed@example.com', username: 'ahmed_m' }),
];

describe('filterAccounts', () => {
  it('returns every account for an empty query', () => {
    expect(filterAccounts(users, '')).toHaveLength(3);
    expect(filterAccounts(users, '   ')).toHaveLength(3);
  });

  it('finds by email fragment, case-insensitive', () => {
    expect(filterAccounts(users, 'ALHINAAWI').map((u) => u.id)).toEqual(['u1']);
    expect(filterAccounts(users, 'gmail.com')).toHaveLength(2);
  });

  it('finds by phone fragment', () => {
    expect(filterAccounts(users, '0102892').map((u) => u.id)).toEqual(['u1']);
  });

  it('finds Arabic names regardless of hamza/aleph form', () => {
    expect(filterAccounts(users, 'احمد').map((u) => u.id)).toEqual(['u3']);
    expect(filterAccounts(users, 'أحمد').map((u) => u.id)).toEqual(['u3']);
  });

  it('finds by username', () => {
    expect(filterAccounts(users, 'ahmed_m').map((u) => u.id)).toEqual(['u3']);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterAccounts(users, 'zzz-no-such')).toHaveLength(0);
  });
});
