// ─── بيع المستعمل وتبادل in demo mode (no Supabase): posts live on this device only.
// Photos are kept as small data URLs. Same rules as the database, simplified.
import { LISTING_DAYS, LISTING_RENEW_WINDOW_DAYS } from '@/config/market';
import { RepoError } from '../errors';
import type { MarketListing, MarketMessage, MarketRepo } from './types';

const KEY = 'qaryati_market_v1';
const DAY = 24 * 60 * 60 * 1000;

interface Store {
  listings: MarketListing[];
  messages: MarketMessage[];
  reports: { listingId: string; reporterId: string }[];
}

export function createLocalMarketRepo(
  currentUser: () => { id: string; name: string } | null,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage
): MarketRepo {
  let memory: Store = { listings: [], messages: [], reports: [] };
  const load = (): Store => {
    try {
      const raw = storage?.getItem(KEY);
      if (raw) memory = JSON.parse(raw) as Store;
    } catch {
      /* keep memory */
    }
    return memory;
  };
  const save = (s: Store) => {
    memory = s;
    try {
      storage?.setItem(KEY, JSON.stringify(s));
    } catch {
      /* full: keep memory */
    }
  };
  const me = () => {
    const u = currentUser();
    if (!u) throw new RepoError('rejected', 'سجّل دخولك الأول');
    return u;
  };
  const live = (l: MarketListing) => l.status === 'active' && new Date(l.expiresAt).getTime() > Date.now();
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const find = (s: Store, id: string) => {
    const l = s.listings.find((x) => x.id === id);
    if (!l) throw new RepoError('rejected', 'الإعلان ده مش موجود');
    return l;
  };
  const owned = (s: Store, id: string) => {
    const l = find(s, id);
    if (l.ownerId !== me().id) throw new RepoError('rejected', 'الإعلان ده مش بتاعك');
    return l;
  };

  return {
    photoUrl: (path) => path,
    async list(kind, opts) {
      return load()
        .listings.filter((l) => l.kind === kind && (opts?.hidden ? l.status === 'hidden' : live(l)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async get(id) {
      const l = load().listings.find((x) => x.id === id);
      if (!l) return null;
      return live(l) || l.ownerId === currentUser()?.id ? l : null;
    },
    async mine() {
      const u = currentUser();
      if (!u) return [];
      return load().listings.filter((l) => l.ownerId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async create(d) {
      const u = me();
      const s = load();
      const now = new Date();
      const l: MarketListing = {
        id: uid(),
        ownerId: u.id,
        ownerName: u.name.split(' ').slice(0, 2).join(' '),
        kind: d.kind,
        title: d.title.trim(),
        category: d.category || 'other',
        condition: d.condition || 'used',
        village: d.village.trim(),
        description: d.description.trim(),
        price: d.kind === 'sale' ? d.price : null,
        negotiable: d.kind === 'sale' && d.negotiable,
        wanted: d.kind === 'swap' ? d.wanted.trim() : '',
        photos: d.photos,
        photoPaths: d.photos,
        contactPhone: d.showPhone ? d.contactPhone : null,
        status: 'active',
        reportsCount: 0,
        expiresAt: new Date(now.getTime() + LISTING_DAYS * DAY).toISOString(),
        createdAt: now.toISOString(),
      };
      save({ ...s, listings: [l, ...s.listings] });
      return l;
    },
    async update(id, d) {
      const s = load();
      const old = owned(s, id);
      const l: MarketListing = {
        ...old,
        title: d.title.trim(),
        category: d.category || old.category,
        condition: d.condition || old.condition,
        village: d.village.trim(),
        description: d.description.trim(),
        price: old.kind === 'sale' ? d.price : null,
        negotiable: old.kind === 'sale' && d.negotiable,
        wanted: old.kind === 'swap' ? d.wanted.trim() : '',
        photos: d.photos,
        photoPaths: d.photos,
        contactPhone: d.showPhone ? d.contactPhone : null,
      };
      save({ ...s, listings: s.listings.map((x) => (x.id === id ? l : x)) });
      return l;
    },
    async setStatus(id, status) {
      const s = load();
      const old = owned(s, id);
      if (old.status === 'hidden' || status === 'hidden') throw new RepoError('rejected', 'ماتقدرش تغيّر حالة الإعلان ده');
      if ((status === 'sold' && old.kind !== 'sale') || (status === 'swapped' && old.kind !== 'swap')) {
        throw new RepoError('rejected', 'الطلب مااتنفّذش');
      }
      const l = { ...old, status };
      save({ ...s, listings: s.listings.map((x) => (x.id === id ? l : x)) });
      return l;
    },
    async remove(listing) {
      const s = load();
      owned(s, listing.id);
      save({
        listings: s.listings.filter((x) => x.id !== listing.id),
        messages: s.messages.filter((m) => m.listingId !== listing.id),
        reports: s.reports.filter((r) => r.listingId !== listing.id),
      });
    },
    async renew(id) {
      const s = load();
      const old = owned(s, id);
      if (old.status !== 'active') throw new RepoError('rejected', 'الإعلان ده مش منشور دلوقتي');
      if (new Date(old.expiresAt).getTime() - Date.now() > LISTING_RENEW_WINDOW_DAYS * DAY) {
        throw new RepoError('rejected', 'تقدر تجدّده في آخر 7 أيام من مدته');
      }
      const l = { ...old, expiresAt: new Date(Date.now() + LISTING_DAYS * DAY).toISOString() };
      save({ ...s, listings: s.listings.map((x) => (x.id === id ? l : x)) });
      return l;
    },
    async report(id) {
      const u = me();
      const s = load();
      const l = find(s, id);
      if (l.ownerId === u.id) throw new RepoError('rejected', 'ده إعلانك');
      if (s.reports.some((r) => r.listingId === id && r.reporterId === u.id)) {
        throw new RepoError('rejected', 'بلّغت عن الإعلان ده قبل كده، شكرًا ليك');
      }
      const count = l.reportsCount + 1;
      const next = { ...l, reportsCount: count, status: count >= 3 && l.status === 'active' ? ('hidden' as const) : l.status };
      save({
        ...s,
        reports: [...s.reports, { listingId: id, reporterId: u.id }],
        listings: s.listings.map((x) => (x.id === id ? next : x)),
      });
    },
    async uploadPhoto(_userId, file) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new RepoError('rejected', 'الصورة مااترفعتش، جرّب صورة تانية'));
        reader.readAsDataURL(file);
      });
    },
    async deletePhotos() {
      /* data URLs: nothing to delete */
    },
    async thread(listingId, buyerId) {
      return load().messages.filter((m) => m.listingId === listingId && m.buyerId === buyerId);
    },
    async send(listingId, buyerId, body) {
      const u = me();
      const s = load();
      const l = find(s, listingId);
      const isOwner = l.ownerId === u.id;
      if (isOwner ? buyerId === u.id : buyerId !== u.id || !live(l)) {
        throw new RepoError('rejected', 'الرسالة مااتبعتتش. يمكن الإعلان اتباع أو اتشال');
      }
      const m: MarketMessage = {
        id: uid(),
        listingId,
        buyerId,
        senderId: u.id,
        body: body.trim(),
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      save({ ...s, messages: [...s.messages, m] });
      return m;
    },
    async markRead(listingId, buyerId) {
      const u = currentUser();
      if (!u) return;
      const s = load();
      const now = new Date().toISOString();
      save({
        ...s,
        messages: s.messages.map((m) =>
          m.listingId === listingId && m.buyerId === buyerId && m.senderId !== u.id && !m.readAt ? { ...m, readAt: now } : m
        ),
      });
    },
    async conversations() {
      const u = currentUser();
      if (!u) return [];
      const s = load();
      const threads = new Map<string, MarketMessage[]>();
      for (const m of s.messages) {
        const l = s.listings.find((x) => x.id === m.listingId);
        if (!l || (m.buyerId !== u.id && l.ownerId !== u.id)) continue;
        const k = `${m.listingId}|${m.buyerId}`;
        threads.set(k, [...(threads.get(k) ?? []), m]);
      }
      return [...threads.values()]
        .map((msgs) => {
          const last = msgs[msgs.length - 1];
          const l = s.listings.find((x) => x.id === last.listingId)!;
          return {
            listingId: l.id,
            listingTitle: l.title,
            listingKind: l.kind,
            listingPhoto: l.photos[0] ?? null,
            buyerId: last.buyerId,
            otherName: l.ownerId === u.id ? 'مشتري' : l.ownerName,
            iAmOwner: l.ownerId === u.id,
            lastBody: last.body,
            lastAt: last.createdAt,
            lastFromMe: last.senderId === u.id,
            unread: msgs.filter((m) => m.senderId !== u.id && !m.readAt).length,
          };
        })
        .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    },
  };
}
