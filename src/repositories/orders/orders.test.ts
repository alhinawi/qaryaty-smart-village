import { describe, expect, it } from 'vitest';
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
