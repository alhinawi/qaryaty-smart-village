import { describe, expect, it, vi } from 'vitest';
import { shopBasicsPayload, updateShopBasics } from './supabaseCatalogRepo';

describe('shopBasicsPayload', () => {
  it('maps only the fields that were actually changed', () => {
    expect(shopBasicsPayload({})).toEqual({});
    expect(shopBasicsPayload({ open: false })).toEqual({ open: false });
    expect(shopBasicsPayload({ hours: '⏰ 7ص - 12م' })).toEqual({ time: '⏰ 7ص - 12م' });
    expect(shopBasicsPayload({ busy: true, busyUntil: null })).toEqual({ is_busy: true, busy_until: null });
    expect(shopBasicsPayload({ description: 'بقالة', photo: 'https://x/y.jpg' })).toEqual({
      description: 'بقالة',
      photo: 'https://x/y.jpg',
    });
  });
  it('keeps an explicit busy auto-end instead of dropping it', () => {
    expect(shopBasicsPayload({ busy: true, busyUntil: '2026-11-07T15:00:00Z' })).toEqual({
      is_busy: true,
      busy_until: '2026-11-07T15:00:00Z',
    });
  });
});

describe('updateShopBasics', () => {
  it('skips the server call entirely when nothing changed', async () => {
    const getClient = vi.fn();
    await updateShopBasics(getClient as never, 7, {});
    expect(getClient).not.toHaveBeenCalled();
  });
  it('updates the merchant shop row by id', async () => {
    const updated: { payload?: Record<string, unknown>; id?: number } = {};
    const builder = {
      update: (payload: Record<string, unknown>) => {
        updated.payload = payload;
        return {
          eq: async (col: string, id: number) => {
            if (col === 'id') updated.id = id;
            return { error: null };
          },
        };
      },
    };
    const getClient = vi.fn(async () => ({ from: (table: string) => (table === 'shops' ? builder : null) }));
    await updateShopBasics(getClient as never, 7, { open: true, hours: '⏰ 24 ساعة' });
    expect(updated.payload).toEqual({ open: true, time: '⏰ 24 ساعة' });
    expect(updated.id).toBe(7);
  });
  it('surfaces a rejection as a RepoError with the Egyptian message', async () => {
    const builder = { update: () => ({ eq: async () => ({ error: { message: 'RLS' } }) }) };
    const getClient = vi.fn(async () => ({ from: () => builder }));
    await expect(updateShopBasics(getClient as never, 7, { open: true })).rejects.toThrow('ماقدرناش نحفظ التعديل');
  });
});
