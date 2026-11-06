import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockOrderRepo } from './mockOrderRepo';
import { createSupabaseOrderRepo, orderToRow } from './supabaseOrderRepo';
import type { NewOrder } from './types';
import { RepoError } from '../errors';

const input: NewOrder = {
  orderNumber: '#1234',
  serviceName: 'مدرس عربي',
  serviceEmoji: '📚',
  address: 'شارع الجامع',
  phone: '01012345678',
  paymentMethod: 'cash',
  discountAmount: 0,
  totalAmount: 50,
  isEstimate: true,
  status: 'pending',
  serviceId: 15,
  providerId: 1,
};

function fakeClient(insertError: { code?: string; message: string } | null) {
  const inserted: unknown[] = [];
  const client = {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => ({
      insert: async (row: unknown) => {
        inserted.push(row);
        return { error: insertError };
      },
    }),
  } as unknown as SupabaseClient;
  return { client, inserted };
}

describe('order repositories', () => {
  it('mock repo returns the order with an id', async () => {
    const order = await createMockOrderRepo().createOrder(input);
    expect(order.id).toMatch(/^ord_/);
    expect(order.orderNumber).toBe('#1234');
  });

  it('supabase repo inserts a snake_case row and returns the order', async () => {
    const { client, inserted } = fakeClient(null);
    const order = await createSupabaseOrderRepo(async () => client).createOrder(input);
    expect(inserted[0]).toMatchObject({ id: order.id, order_number: '#1234', provider_id: 1, user_id: null });
  });

  it('a database refusal is a clear "rejected" error, not an outage', async () => {
    const { client } = fakeClient({ code: '42501', message: 'permission denied' });
    const error = await createSupabaseOrderRepo(async () => client).createOrder(input).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RepoError);
    expect((error as RepoError).code).toBe('rejected');
  });

  it('a second use of the first-order code says so', async () => {
    const { client } = fakeClient({
      code: '23505',
      message: 'duplicate key value violates unique constraint "orders_one_promo_per_user"',
    });
    const error = await createSupabaseOrderRepo(async () => client).createOrder(input).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RepoError);
    expect((error as RepoError).message).toContain('QARYA1');
  });

  it('a server/network failure is passed up so the wrapper can report the outage', async () => {
    const { client } = fakeClient({ message: 'FetchError: failed to fetch' });
    const error = await createSupabaseOrderRepo(async () => client).createOrder(input).catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(RepoError);
  });

  it('orderToRow keeps missing optional fields as null', () => {
    const row = orderToRow('x', { ...input, providerId: undefined, notes: undefined }, null);
    expect(row.provider_id).toBeNull();
    expect(row.notes).toBeNull();
  });
});


describe('owned server history', () => {
  function clientFor(userId: string | null, data: unknown[] = [], error: unknown = null) {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(async () => ({ data, error })) };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query);
    const from = vi.fn(() => query);
    const client = { auth: { getSession: async () => ({ data: { session: userId ? { user: { id: userId } } : null } }) }, from } as unknown as SupabaseClient;
    return { query, from, repo: createSupabaseOrderRepo(async () => client) };
  }
  it('refuses mismatched or guest sessions before querying', async () => {
    for (const id of [null, 'bob']) {
      const { repo, from } = clientFor(id);
      await expect(repo.listMine('alice')).rejects.toThrow();
      expect(from).not.toHaveBeenCalled();
    }
  });
  it('filters by actual owner even for an admin session and checks returned owners', async () => {
    const { repo, query } = clientFor('alice', [{ user_id: 'bob', id: 'secret' }]);
    expect(await repo.listMine('alice', 50)).toEqual([]);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'alice');
    expect(query.range).toHaveBeenCalledWith(50, 99);
    expect(query.select.mock.calls[0][0]).not.toContain('paymob_order_id');
  });
  it('surfaces errors without falling back to sample orders', async () => {
    const { repo } = clientFor('alice', [], new Error('offline'));
    await expect(repo.listMine('alice')).rejects.toThrow('offline');
  });
  it('maps actual server total, cancelled status and original date without fabricated ratings', async () => {
    const { repo } = clientFor('alice', [{ ...orderToRow('x', input, 'alice'), total_amount: 77,
      status: 'cancelled', payment_status: 'unpaid', created_at: '2026-11-06T09:00:00Z' }]);
    const [order] = await repo.listMine('alice');
    expect(order).toMatchObject({ id: 'x', totalAmount: 77, status: 'cancelled', paymentStatus: 'unpaid' });
    expect(order.rating).toBeUndefined();
    expect(order.createdAt).toBeTruthy();
  });
});
