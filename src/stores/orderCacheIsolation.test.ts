import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Order, AuthSession } from '@/types';

const storage = new Map<string, string>();
let onStorage: ((event: { key: string | null }) => void) | undefined;
const localStorageFake = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
};
const historyRepo = vi.hoisted(() => ({ listMine: vi.fn() }));
const authRepo = vi.hoisted(() => ({ logout: vi.fn(async () => {}), getUser: vi.fn() }));
vi.mock('@/repositories', () => ({ isSupabaseConfigured: true, orderRepo: historyRepo, authRepo, AuthError: class extends Error {} }));
const order = (id: string) => ({ id, address: 'private address', phone: '01012345678', notes: 'private notes' }) as Order;
const session = (id: string) => ({ token: `token-${id}`, user: { id } }) as AuthSession;

async function load() {
  const { useOrderStore } = await import('./useOrderStore');
  const { useAuthStore } = await import('./useAuthStore');
  return { orders: useOrderStore, auth: useAuthStore };
}

beforeEach(() => {
  vi.resetModules();
  storage.clear();
  historyRepo.listMine.mockReset();
  vi.stubGlobal('localStorage', localStorageFake);
  onStorage = undefined;
  vi.stubGlobal('window', { localStorage: localStorageFake, addEventListener: (_name: string, cb: typeof onStorage) => { onStorage = cb; } });
});

describe('private order cache boundaries', () => {
  it('never hydrates private live rows from even the scoped storage key', async () => {
    storage.set('qaryati_orders_scoped_v3', JSON.stringify({ version: 3, state: { orders: [order('disk-secret')], ownerId: 'alice' } }));
    const { orders } = await load();
    expect(orders.getState().orders).toEqual([]);
  });
  it('ignores an old auth profile refresh after switching accounts', async () => {
    const { auth } = await load();
    auth.setState({ session: session('alice') });
    let resolve!: (value: { id: string }) => void;
    authRepo.getUser.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const pending = auth.getState().refresh();
    auth.setState({ session: session('bob') });
    resolve({ id: 'alice' });
    await pending;
    expect(auth.getState().session?.user.id).toBe('bob');
  });
  it('clears this tab when another tab removes all auth storage', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    orders.getState().addOrder(order('alice-order'), orders.getState().scopeVersion);
    storage.clear();
    onStorage?.({ key: null });
    expect(auth.getState().session).toBeNull();
    expect(orders.getState().orders).toEqual([]);
  });
  it('clears the current tab when a different tab logs out', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    orders.getState().addOrder(order('alice-order'), orders.getState().scopeVersion);
    storage.set('qaryati_auth_session', JSON.stringify({ version: 0, state: { session: null } }));
    onStorage?.({ key: 'qaryati_auth_session' });
    expect(auth.getState().session).toBeNull();
    expect(orders.getState().orders).toEqual([]);
    expect(orders.getState().activeOrder).toBeNull();
  });

  it('clears private orders and active order on logout, including persisted state', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    orders.getState().addOrder(order('alice-order'), orders.getState().scopeVersion);
    await auth.getState().logout();
    expect(orders.getState().orders).toEqual([]);
    expect(orders.getState().activeOrder).toBeNull();
    expect(orders.getState().ownerId).toBeNull();
    expect((storage.get('qaryati_orders_scoped_v3') ?? '')).not.toContain('private address');
    expect((storage.get('qaryati_orders_scoped_v3') ?? '')).not.toContain('alice-order');
  });

  it('clears A when switching directly to B; session refresh for A keeps A orders', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    orders.getState().addOrder(order('alice-order'), orders.getState().scopeVersion);
    auth.setState({ session: session('alice') });
    expect(orders.getState().orders).toHaveLength(1);
    auth.setState({ session: session('bob') });
    expect(orders.getState().orders).toEqual([]);
    expect(orders.getState().activeOrder).toBeNull();
    expect(orders.getState().ownerId).toBe('bob');
  });

  it('does not adopt anonymous private history into a signed-in account', async () => {
    const { orders, auth } = await load();
    orders.getState().addOrder(order('guest-order'), orders.getState().scopeVersion);
    auth.setState({ session: session('alice') });
    expect(orders.getState().orders).toEqual([]);
  });

  it('rejects a late order response even after A logs out and logs back into A', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    const oldScope = orders.getState().scopeVersion;
    await auth.getState().logout();
    auth.setState({ session: session('alice') });
    expect(orders.getState().addOrder(order('late'), oldScope)).toBe(false);
    expect(orders.getState().orders).toEqual([]);
  });

  it('preserves ownerless legacy bytes without reading or assigning them', async () => {
    storage.set('qaryati_orders_storage', JSON.stringify({ version: 1, state: { orders: [order('legacy')], activeOrder: order('legacy') } }));
    storage.set('qaryati_auth_session', JSON.stringify({ version: 0, state: { session: session('bob') } }));
    const legacy = storage.get('qaryati_orders_storage');
    const { orders } = await load();
    expect(storage.get('qaryati_orders_storage')).toBe(legacy);
    expect(orders.getState().orders).toEqual([]);
    expect(orders.getState().ownerId).toBe('bob');
    expect((storage.get('qaryati_orders_scoped_v3') ?? '')).not.toContain('private address');
  });

  it('never exposes an old v2 cache even to a matching restored account', async () => {
    storage.set('qaryati_orders_storage', JSON.stringify({ version: 2, state: { ownerId: 'alice', orders: [order('saved')], activeOrder: order('saved') } }));
    storage.set('qaryati_auth_session', JSON.stringify({ version: 0, state: { session: session('alice') } }));
    const { orders } = await load();
    expect(orders.getState().orders).toEqual([]);
    expect(storage.get('qaryati_orders_storage')).toContain('saved');
  });

  it('leaves old bytes intact but not visible when another account or guest restores', async () => {
    storage.set('qaryati_orders_storage', JSON.stringify({ version: 2, state: { ownerId: 'alice', orders: [order('saved')], activeOrder: order('saved') } }));
    const { orders } = await load();
    expect(orders.getState().orders).toEqual([]);
    expect(orders.getState().activeOrder).toBeNull();
    expect((storage.get('qaryati_orders_scoped_v3') ?? '')).not.toContain('private address');
  });
});


describe('server order history', () => {
  it('loads the signed-in owner and replaces stale server totals/status', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    orders.getState().addOrder({ ...order('saved'), status: 'pending', totalAmount: 1 }, orders.getState().scopeVersion);
    historyRepo.listMine.mockResolvedValue([{ ...order('saved'), status: 'done', totalAmount: 27 }]);
    await orders.getState().loadHistory();
    expect(historyRepo.listMine).toHaveBeenCalledWith('alice', 0);
    expect(orders.getState().orders).toMatchObject([{ id: 'saved', status: 'done', totalAmount: 27 }]);
    expect(orders.getState().activeOrder?.status).toBe('done');
    expect(storage.get('qaryati_orders_scoped_v3')).not.toContain('private address');
  });
  it('ignores late history after account switch, even if old owner signs back in', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    let resolve!: (rows: Order[]) => void;
    historyRepo.listMine.mockImplementation(() => new Promise(r => { resolve = r; }));
    const pending = orders.getState().loadHistory();
    auth.setState({ session: session('bob') });
    auth.setState({ session: session('alice') });
    resolve([order('private-alice')]);
    await pending;
    expect(orders.getState().orders).toEqual([]);
    expect(orders.getState().historyLoaded).toBe(false);
  });
  it('does not request guest history or pretend an outage is an empty success', async () => {
    const { orders, auth } = await load();
    await orders.getState().loadHistory();
    expect(historyRepo.listMine).not.toHaveBeenCalled();
    auth.setState({ session: session('alice') });
    orders.getState().addOrder(order('existing'), orders.getState().scopeVersion);
    historyRepo.listMine.mockRejectedValue(new Error('offline'));
    await orders.getState().loadHistory();
    expect(orders.getState().historyError).toBeTruthy();
    expect(orders.getState().historyLoaded).toBe(false);
    expect(orders.getState().orders[0].id).toBe('existing');
  });
  it('paginates older history and deduplicates overlapping rows', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    historyRepo.listMine.mockResolvedValueOnce(Array.from({ length: 50 }, (_, i) => order(String(i))));
    await orders.getState().loadHistory();
    expect(orders.getState().historyHasMore).toBe(true);
    historyRepo.listMine.mockResolvedValueOnce([order('49'), order('50')]);
    await orders.getState().loadHistory(true);
    expect(historyRepo.listMine).toHaveBeenLastCalledWith('alice', 50);
    expect(orders.getState().orders).toHaveLength(51);
    expect(orders.getState().historyHasMore).toBe(false);
  });
  it('keeps a new order returned during a history refresh', async () => {
    const { orders, auth } = await load();
    auth.setState({ session: session('alice') });
    let resolve!: (rows: Order[]) => void;
    historyRepo.listMine.mockImplementation(() => new Promise(r => { resolve = r; }));
    const pending = orders.getState().loadHistory();
    orders.getState().addOrder(order('new'), orders.getState().scopeVersion);
    resolve([order('old')]);
    await pending;
    expect(orders.getState().orders.map(o => o.id)).toEqual(['new', 'old']);
  });
});
