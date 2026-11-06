// ─── بيع المستعمل وتبادل in Supabase (see supabase/migrations/20261106180000_market.sql)
// Tables market_listings / market_reports / market_messages, bucket market-photos.
// RLS: everyone reads live posts; signed-in people post as themselves; the owner
// (or an admin) edits and deletes; photos go only to the uploader's own folder.
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '../errors';
import { isRejectedByDatabase } from '../orders/supabaseOrderRepo';
import type {
  ListingDraft,
  MarketConversation,
  MarketListing,
  MarketMessage,
  MarketRepo,
} from './types';

export const MARKET_BUCKET = 'market-photos';
const COLUMNS =
  'id, owner_id, owner_name, kind, title, category, condition, village, description, price, negotiable, wanted, photos, contact_phone, status, reports_count, expires_at, created_at';

export interface ListingRow {
  id: string;
  owner_id: string;
  owner_name: string;
  kind: MarketListing['kind'];
  title: string;
  category: MarketListing['category'];
  condition: MarketListing['condition'];
  village: string;
  description: string | null;
  price: number | null;
  negotiable: boolean;
  wanted: string | null;
  photos: string[] | null;
  contact_phone: string | null;
  status: MarketListing['status'];
  reports_count: number;
  expires_at: string;
  created_at: string;
}

/** The database's own refusals (raise exception 'market:…') in Egyptian Arabic */
const DB_MESSAGES: Record<string, string> = {
  'market:blocked': 'حسابك موقوف، ماتقدرش تنشر دلوقتي',
  'market:too_many': 'نشرت 10 إعلانات النهاردة، كمّل بكرة',
  'market:bad_photo': 'فيه صورة مااترفعتش صح، شيلها وارفعها تاني',
  'market:not_found': 'الإعلان ده مش موجود',
  'market:not_active': 'الإعلان ده مش منشور دلوقتي',
  'market:too_early': 'تقدر تجدّده في آخر 7 أيام من مدته',
  'market:too_many_messages': 'بعتّ رسايل كتير، استنى شوية وجرّب تاني',
};

export function marketErrorMessage(error: { code?: string; message?: string }, fallback: string): string | null {
  const key = Object.keys(DB_MESSAGES).find((k) => error.message?.includes(k));
  if (key) return DB_MESSAGES[key];
  if (error.code === '23505') return 'بلّغت عن الإعلان ده قبل كده، شكرًا ليك';
  if (error.code === '42501' || isRejectedByDatabase(error.code)) return fallback;
  return null;
}

function check(error: { code?: string; message?: string } | null, fallback = 'الطلب مااتنفّذش، راجع البيانات وجرّب تاني') {
  if (!error) return;
  const message = marketErrorMessage(error, fallback);
  if (message) throw new RepoError('rejected', message, { cause: error });
  throw error;
}

export function rowToListing(row: ListingRow, photoUrl: (path: string) => string): MarketListing {
  const paths = row.photos ?? [];
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? '',
    kind: row.kind,
    title: row.title,
    category: row.category,
    condition: row.condition,
    village: row.village,
    description: row.description ?? '',
    price: row.price == null ? null : Number(row.price),
    negotiable: !!row.negotiable,
    wanted: row.wanted ?? '',
    photos: paths.map(photoUrl),
    photoPaths: paths,
    contactPhone: row.contact_phone,
    status: row.status,
    reportsCount: row.reports_count ?? 0,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function draftToRow(d: ListingDraft) {
  return {
    kind: d.kind,
    title: d.title.trim(),
    category: d.category,
    condition: d.condition,
    village: d.village.trim(),
    description: d.description.trim(),
    price: d.kind === 'sale' ? d.price : null,
    negotiable: d.kind === 'sale' ? d.negotiable : false,
    wanted: d.kind === 'swap' ? d.wanted.trim() : '',
    photos: d.photos,
    contact_phone: d.showPhone ? d.contactPhone : null,
  };
}

interface MessageRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

function rowToMessage(r: MessageRow): MarketMessage {
  return {
    id: r.id,
    listingId: r.listing_id,
    buyerId: r.buyer_id,
    senderId: r.sender_id,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export function createSupabaseMarketRepo(getClient: () => Promise<SupabaseClient>, supabaseUrl: string): MarketRepo {
  const photoUrl = (path: string) =>
    `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${MARKET_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const toListing = (row: unknown) => rowToListing(row as ListingRow, photoUrl);

  return {
    photoUrl,
    async list(kind, opts) {
      const supabase = await getClient();
      let q = supabase.from('market_listings').select(COLUMNS).eq('kind', kind);
      q = opts?.hidden
        ? q.eq('status', 'hidden')
        : q.eq('status', 'active').gt('expires_at', new Date().toISOString());
      const { data, error } = await q.order('created_at', { ascending: false }).limit(300);
      check(error);
      return (data ?? []).map(toListing);
    },
    async get(id) {
      const supabase = await getClient();
      const { data, error } = await supabase.from('market_listings').select(COLUMNS).eq('id', id).maybeSingle();
      if (error?.code === '22P02') return null; // not a uuid
      check(error);
      return data ? toListing(data) : null;
    },
    async mine() {
      const supabase = await getClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from('market_listings')
        .select(COLUMNS)
        .eq('owner_id', auth.user.id)
        .order('created_at', { ascending: false });
      check(error);
      return (data ?? []).map(toListing);
    },
    async create(draft) {
      const supabase = await getClient();
      const { data, error } = await supabase.from('market_listings').insert(draftToRow(draft)).select(COLUMNS).single();
      check(error, 'الإعلان مااتنشرش، راجع البيانات وجرّب تاني');
      return toListing(data);
    },
    async update(id, draft) {
      const supabase = await getClient();
      const { kind: _kind, ...row } = draftToRow(draft);
      const { data, error } = await supabase.from('market_listings').update(row).eq('id', id).select(COLUMNS).single();
      check(error, 'التعديل مااتحفظش، راجع البيانات وجرّب تاني');
      return toListing(data);
    },
    async setStatus(id, status) {
      const supabase = await getClient();
      const { data, error } = await supabase.from('market_listings').update({ status }).eq('id', id).select(COLUMNS).single();
      check(error);
      return toListing(data);
    },
    async remove(listing) {
      const supabase = await getClient();
      const { error } = await supabase.from('market_listings').delete().eq('id', listing.id);
      check(error);
      if (listing.photoPaths.length) {
        // Best effort: the post is gone either way
        await supabase.storage.from(MARKET_BUCKET).remove(listing.photoPaths).catch(() => undefined);
      }
    },
    async renew(id) {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('renew_market_listing', { p_id: id });
      check(error);
      return toListing(Array.isArray(data) ? data[0] : data);
    },
    async report(id, reason, note) {
      const supabase = await getClient();
      const { error } = await supabase.from('market_reports').insert({ listing_id: id, reason, note: note.trim().slice(0, 300) });
      check(error);
    },
    async uploadPhoto(userId, file) {
      const supabase = await getClient();
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const path = `${userId}/${name}`;
      const { error } = await supabase.storage
        .from(MARKET_BUCKET)
        .upload(path, file, { contentType: file.type || 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (error) throw new RepoError('rejected', 'الصورة مااترفعتش، جرّب صورة تانية', { cause: error });
      return path;
    },
    async deletePhotos(paths) {
      if (!paths.length) return;
      const supabase = await getClient();
      await supabase.storage.from(MARKET_BUCKET).remove(paths).catch(() => undefined);
    },
    async thread(listingId, buyerId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('market_messages')
        .select('id, listing_id, buyer_id, sender_id, body, read_at, created_at')
        .eq('listing_id', listingId)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: true })
        .limit(500);
      check(error);
      return ((data ?? []) as MessageRow[]).map(rowToMessage);
    },
    async send(listingId, buyerId, body) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('market_messages')
        .insert({ listing_id: listingId, buyer_id: buyerId, body: body.trim() })
        .select('id, listing_id, buyer_id, sender_id, body, read_at, created_at')
        .single();
      check(error, 'الرسالة مااتبعتتش. يمكن الإعلان اتباع أو اتشال');
      return rowToMessage(data as MessageRow);
    },
    async markRead(listingId, buyerId) {
      const supabase = await getClient();
      const { error } = await supabase.rpc('mark_market_thread_read', { p_listing: listingId, p_buyer: buyerId });
      check(error);
    },
    async conversations() {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('market_conversations');
      check(error);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        listingId: r.listing_id as string,
        listingTitle: r.listing_title as string,
        listingKind: r.listing_kind as MarketConversation['listingKind'],
        listingPhoto: r.listing_photo ? photoUrl(r.listing_photo as string) : null,
        buyerId: r.buyer_id as string,
        otherName: (r.other_name as string) || '',
        iAmOwner: !!r.i_am_owner,
        lastBody: r.last_body as string,
        lastAt: r.last_at as string,
        lastFromMe: !!r.last_from_me,
        unread: Number(r.unread ?? 0),
      }));
    },
  };
}
