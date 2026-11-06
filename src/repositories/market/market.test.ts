import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalMarketRepo } from './localMarketRepo';
import { draftToRow, marketErrorMessage, rowToListing, type ListingRow } from './supabaseMarketRepo';
import type { ListingDraft, MarketRepo } from './types';

const sale: ListingDraft = {
  kind: 'sale',
  title: ' تلاجة شارب ',
  category: 'devices',
  condition: 'good',
  village: ' منية سندوب ',
  description: ' نضيفة ',
  price: 3500,
  negotiable: true,
  wanted: 'مش مهم',
  photos: ['u1/a.jpg'],
  showPhone: true,
  contactPhone: '01012345678',
};
const swap: ListingDraft = { ...sale, kind: 'swap', price: 100, negotiable: true, wanted: ' بوتاجاز ', showPhone: false };

describe('supabase market repo', () => {
  it('maps a sale form to the columns, without what a swap wants', () => {
    expect(draftToRow(sale)).toEqual({
      kind: 'sale',
      title: 'تلاجة شارب',
      category: 'devices',
      condition: 'good',
      village: 'منية سندوب',
      description: 'نضيفة',
      price: 3500,
      negotiable: true,
      wanted: '',
      photos: ['u1/a.jpg'],
      contact_phone: '01012345678',
    });
  });

  it('maps a swap form without a price, and hides the phone when asked', () => {
    const row = draftToRow(swap);
    expect(row.price).toBeNull();
    expect(row.negotiable).toBe(false);
    expect(row.wanted).toBe('بوتاجاز');
    expect(row.contact_phone).toBeNull();
  });

  it('reads a row back with public photo links and keeps the bucket paths', () => {
    const row: ListingRow = {
      id: 'l1',
      owner_id: 'u1',
      owner_name: 'محمد عاطف',
      kind: 'sale',
      title: 'تلاجة',
      category: 'devices',
      condition: 'good',
      village: 'بدواي',
      description: null,
      price: 3500,
      negotiable: false,
      wanted: null,
      photos: ['u1/a.jpg'],
      contact_phone: null,
      status: 'active',
      reports_count: 0,
      expires_at: '2026-12-06T00:00:00Z',
      created_at: '2026-11-06T00:00:00Z',
    };
    const l = rowToListing(row, (p) => `https://x/${p}`);
    expect(l.photos).toEqual(['https://x/u1/a.jpg']);
    expect(l.photoPaths).toEqual(['u1/a.jpg']);
    expect(l.description).toBe('');
    expect(l.wanted).toBe('');
    expect(l.ownerName).toBe('محمد عاطف');
  });

  it('turns the database refusals into Egyptian Arabic', () => {
    expect(marketErrorMessage({ message: 'market:too_many' }, 'x')).toContain('10');
    expect(marketErrorMessage({ message: 'market:too_early' }, 'x')).toContain('7');
    expect(marketErrorMessage({ code: '23505' }, 'x')).toContain('بلّغت');
    expect(marketErrorMessage({ code: '42501' }, 'fallback')).toBe('fallback');
    expect(marketErrorMessage({ code: '08006', message: 'connection' }, 'x')).toBeNull();
  });
});

describe('demo market repo (this device)', () => {
  let who: { id: string; name: string } | null;
  let repo: MarketRepo;
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };

  beforeEach(() => {
    store.clear();
    who = { id: 'owner', name: 'محمد عاطف فاضل' };
    repo = createLocalMarketRepo(() => who, storage);
  });

  it('needs a signed-in person to post', async () => {
    who = null;
    await expect(repo.create(sale)).rejects.toThrow('سجّل دخولك');
  });

  it('posts a sale and a swap, each in its own list', async () => {
    const s = await repo.create(sale);
    const w = await repo.create(swap);
    expect(s.ownerName).toBe('محمد عاطف');
    expect(s.title).toBe('تلاجة شارب');
    expect(s.wanted).toBe('');
    expect(w.price).toBeNull();
    expect((await repo.list('sale')).map((l) => l.id)).toEqual([s.id]);
    expect((await repo.list('swap')).map((l) => l.id)).toEqual([w.id]);
  });

  it('lets a buyer message the owner, and the owner answer', async () => {
    const s = await repo.create(sale);
    who = { id: 'buyer', name: 'أحمد' };
    await repo.send(s.id, 'buyer', 'لسه موجودة؟');
    // A buyer can't write in someone else's thread
    await expect(repo.send(s.id, 'someone', 'هاي')).rejects.toThrow();
    who = { id: 'owner', name: 'محمد' };
    const [t] = await repo.conversations();
    expect(t).toMatchObject({ listingId: s.id, buyerId: 'buyer', iAmOwner: true, unread: 1, lastBody: 'لسه موجودة؟' });
    await repo.markRead(s.id, 'buyer');
    await repo.send(s.id, 'buyer', 'أيوة موجودة');
    expect((await repo.conversations())[0]).toMatchObject({ unread: 0, lastFromMe: true });
    expect(await repo.thread(s.id, 'buyer')).toHaveLength(2);
  });

  it('marks sold, takes it off the list, and puts it back', async () => {
    const s = await repo.create(sale);
    await expect(repo.setStatus(s.id, 'swapped')).rejects.toThrow();
    await repo.setStatus(s.id, 'sold');
    expect(await repo.list('sale')).toEqual([]);
    expect((await repo.mine())[0].status).toBe('sold');
    // Nobody else can message about a sold post
    who = { id: 'buyer', name: 'أحمد' };
    await expect(repo.send(s.id, 'buyer', 'لسه؟')).rejects.toThrow();
    expect(await repo.get(s.id)).toBeNull();
    who = { id: 'owner', name: 'محمد' };
    await repo.setStatus(s.id, 'active');
    expect(await repo.list('sale')).toHaveLength(1);
  });

  it('only lets the owner change or delete a post', async () => {
    const s = await repo.create(sale);
    who = { id: 'buyer', name: 'أحمد' };
    await expect(repo.setStatus(s.id, 'sold')).rejects.toThrow('مش بتاعك');
    await expect(repo.remove(s)).rejects.toThrow('مش بتاعك');
    who = { id: 'owner', name: 'محمد' };
    await repo.remove(s);
    expect(await repo.mine()).toEqual([]);
  });

  it('renews only in the last 7 days', async () => {
    const s = await repo.create(sale);
    await expect(repo.renew(s.id)).rejects.toThrow('آخر 7 أيام');
  });

  it('hides a post on the third report, once per person, never by its owner', async () => {
    const s = await repo.create(sale);
    await expect(repo.report(s.id, 'scam', '')).rejects.toThrow('إعلانك');
    for (const id of ['r1', 'r2']) {
      who = { id, name: id };
      await repo.report(s.id, 'scam', '');
    }
    await expect(repo.report(s.id, 'scam', '')).rejects.toThrow('قبل كده');
    expect(await repo.list('sale')).toHaveLength(1);
    who = { id: 'r3', name: 'r3' };
    await repo.report(s.id, 'fake', '');
    expect(await repo.list('sale')).toEqual([]);
    expect((await repo.list('sale', { hidden: true })).map((l) => l.id)).toEqual([s.id]);
    // The owner can't un-hide it by marking it
    who = { id: 'owner', name: 'محمد' };
    await expect(repo.setStatus(s.id, 'active')).rejects.toThrow();
  });
});
