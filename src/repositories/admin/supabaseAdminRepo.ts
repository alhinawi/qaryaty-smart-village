// ─── Admin dashboard on Supabase
// Reads/writes go through RLS (catalog tables, villages, donation_requests: admins only)
// and security-definer RPCs that check public.is_admin() (orders, overview).
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeArabic } from '../villages/types';
import { DELIVERY_FEE_DEFAULT } from '@/config/delivery';
import { orderFilterArgs, orderFromJson, overviewFromJson } from './logic';
import type {
  AdminDonation,
  AdminProduct,
  AdminProvider,
  AdminRepo,
  AdminService,
  AdminShop,
  AdminVillage,
} from './types';

const BUCKET = 'catalog-photos';

interface DbError {
  code?: string;
  message?: string;
}

/** Turns database errors into Arabic messages the admin can act on. */
export function adminError(error: DbError | null): Error {
  const code = error?.code ?? '';
  const msg = error?.message ?? '';
  if (code === '42501' || /admins only|row-level security|permission denied/i.test(msg)) {
    return new Error('الحساب ده مش أدمن، فالعملية اترفضت');
  }
  if (code === 'P0002') return new Error('الحاجة دي مش موجودة');
  if (code === '23505') return new Error('فيه حاجة بنفس الرقم موجودة قبل كده');
  if (code === '23514' || code === '22023') return new Error('فيه قيمة مش مظبوطة، راجع الخانات');
  return new Error(msg ? `حصلت مشكلة: ${msg}` : 'حصلت مشكلة، جرّب تاني');
}

function check<T>(res: { data: T | null; error: DbError | null }): T {
  if (res.error) throw adminError(res.error);
  return res.data as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const shopFromRow = (r: any): AdminShop => ({
  id: Number(r.id),
  emoji: r.emoji ?? '',
  name: r.name ?? '',
  description: r.description ?? '',
  open: r.open !== false,
  time: r.time ?? '',
  kind: r.kind ?? 'other',
  photo: r.photo ?? null,
  hidden: !!r.hidden,
  deliveryFee: r.delivery_fee == null ? null : Number(r.delivery_fee),
});

const productFromRow = (r: any): AdminProduct => ({
  scope: r.scope,
  productId: r.product_id,
  name: r.name ?? '',
  price: Number(r.price ?? 0),
  unit: r.unit ?? '',
  emoji: r.emoji ?? '',
  section: r.section ?? '',
  photo: r.photo ?? null,
  hidden: !!r.hidden,
});

const serviceFromRow = (r: any): AdminService => ({
  id: Number(r.id),
  cat: r.cat,
  emoji: r.emoji ?? '',
  name: r.name ?? '',
  description: r.description ?? '',
  price: r.price ?? '',
  numericPrice: r.numeric_price == null ? null : Number(r.numeric_price),
  priceType: r.price_type ?? 'fixed',
  hidden: !!r.hidden,
});

const providerFromRow = (r: any): AdminProvider => ({
  id: Number(r.id),
  kind: r.kind,
  serviceId: Number(r.service_id),
  name: r.name ?? '',
  gender: r.gender === 'female' ? 'female' : 'male',
  photo: r.photo ?? null,
  price: r.price ?? '',
  numericPrice: r.numeric_price == null ? null : Number(r.numeric_price),
  priceType: r.price_type ?? 'fixed',
  village: r.village ?? '',
  bio: r.bio ?? '',
  active: r.active !== false,
});

const donationFromRow = (r: any): AdminDonation => ({
  id: r.id,
  createdAt: r.created_at,
  donorName: r.donor_name ?? '',
  phone: r.phone ?? '',
  causeName: r.cause_name ?? '',
  donationType: r.donation_type ?? 'other',
  notes: r.notes ?? '',
  status: r.status ?? 'new',
  adminNote: r.admin_note ?? '',
});

const villageFromRow = (r: any): AdminVillage => ({
  id: Number(r.id),
  name: r.name ?? '',
  markaz: r.markaz ?? '',
  governorate: r.governorate ?? '',
  served: !!r.served,
  deliveryFee: r.delivery_fee == null ? null : Number(r.delivery_fee),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createSupabaseAdminRepo(getClient: () => Promise<SupabaseClient>, supabaseUrl: string): AdminRepo {
  const publicUrl = (path: string) => `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

  return {
    async overview() {
      const sb = await getClient();
      return overviewFromJson(check(await sb.rpc('admin_overview')));
    },

    async listOrders(filter) {
      const sb = await getClient();
      const rows = check(await sb.rpc('admin_list_orders', orderFilterArgs(filter))) as unknown[];
      return (rows ?? []).map(orderFromJson);
    },

    async setOrderStatus(id, status, reason) {
      const sb = await getClient();
      check(
        await sb.rpc('admin_set_order_status', {
          p_id: id,
          p_status: status,
          p_reason: reason ?? null,
        }),
      );
    },

    async listShops() {
      const sb = await getClient();
      return (check(await sb.from('shops').select('*').order('id')) as unknown[]).map(shopFromRow);
    },

    async saveShop(shop) {
      const sb = await getClient();
      const row = {
        emoji: shop.emoji || '🏪',
        name: shop.name.trim(),
        description: shop.description.trim(),
        open: shop.open,
        time: shop.time.trim(),
        kind: shop.kind,
        photo: shop.photo || null,
        hidden: shop.hidden,
        delivery_fee: shop.deliveryFee,
      };
      const q = shop.id ? sb.from('shops').update(row).eq('id', shop.id) : sb.from('shops').insert(row);
      return shopFromRow(check(await q.select('*').single()));
    },

    async listProducts(scope) {
      const sb = await getClient();
      const res = await sb
        .from('catalog_products')
        .select('*')
        .eq('scope', scope)
        .order('position')
        .order('product_id');
      return (check(res) as unknown[]).map(productFromRow);
    },

    async saveProduct(p, isNew) {
      const sb = await getClient();
      const row = {
        name: p.name.trim(),
        price: p.price,
        unit: p.unit.trim(),
        emoji: p.emoji || null,
        section: p.section.trim() || null,
        photo: p.photo || null,
        hidden: p.hidden,
      };
      const q = isNew
        ? sb.from('catalog_products').insert({ ...row, scope: p.scope, product_id: p.productId })
        : sb.from('catalog_products').update(row).eq('scope', p.scope).eq('product_id', p.productId);
      check(await q.select('product_id').single());
    },

    async listServices() {
      const sb = await getClient();
      return (check(await sb.from('services').select('*').order('id')) as unknown[]).map(serviceFromRow);
    },

    async saveService(s) {
      const sb = await getClient();
      const row = {
        cat: s.cat,
        emoji: s.emoji || '🛠️',
        name: s.name.trim(),
        description: s.description.trim(),
        price: s.price,
        numeric_price: s.priceType === 'quote' ? null : s.numericPrice,
        price_type: s.priceType,
        hidden: s.hidden,
      };
      const q = s.id ? sb.from('services').update(row).eq('id', s.id) : sb.from('services').insert(row);
      check(await q.select('id').single());
    },

    async listProviders() {
      const sb = await getClient();
      return (check(await sb.from('providers').select('*').order('id')) as unknown[]).map(providerFromRow);
    },

    async saveProvider(p) {
      const sb = await getClient();
      const row = {
        kind: p.kind,
        service_id: p.serviceId,
        name: p.name.trim(),
        gender: p.gender,
        photo: p.photo || null,
        price: p.price,
        numeric_price: p.priceType === 'quote' ? null : p.numericPrice,
        price_type: p.priceType,
        village: p.village.trim() || null,
        bio: p.bio.trim() || null,
        active: p.active,
      };
      const q = p.id ? sb.from('providers').update(row).eq('id', p.id) : sb.from('providers').insert(row);
      check(await q.select('id').single());
    },

    async uploadPhoto(folder, file) {
      const sb = await getClient();
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw adminError({ message: error.message });
      return publicUrl(path);
    },

    async listDonations() {
      const sb = await getClient();
      const res = await sb.from('donation_requests').select('*').order('created_at', { ascending: false }).limit(200);
      return (check(res) as unknown[]).map(donationFromRow);
    },

    async setDonation(id, status, adminNote) {
      const sb = await getClient();
      const res = await sb
        .from('donation_requests')
        .update({
          status,
          admin_note: adminNote.trim() || null,
          handled_at: status === 'new' ? null : new Date().toISOString(),
        })
        .eq('id', id)
        .select('id')
        .single();
      check(res);
    },

    async listVillages(search) {
      const sb = await getClient();
      const q = normalizeArabic(search.trim()).replace(/[%_\\]/g, '');
      const base = sb.from('villages').select('id,name,markaz,governorate,served,delivery_fee');
      const res = q
        ? await base.like('search_key', `%${q}%`).order('served', { ascending: false }).order('name').limit(40)
        : await base
            .or('served.eq.true,delivery_fee.not.is.null')
            .order('served', { ascending: false })
            .order('name')
            .limit(200);
      return (check(res) as unknown[]).map(villageFromRow);
    },

    async setVillageServed(id, served) {
      const sb = await getClient();
      check(await sb.from('villages').update({ served }).eq('id', id).select('id').single());
    },

    async setVillageDeliveryFee(id, fee) {
      const sb = await getClient();
      check(await sb.from('villages').update({ delivery_fee: fee }).eq('id', id).select('id').single());
    },

    async getDefaultDeliveryFee() {
      const sb = await getClient();
      const res = await sb.from('app_settings').select('value').eq('key', 'delivery_fee_default').maybeSingle();
      const row = check(res) as { value: number | string } | null;
      return row ? Number(row.value) : DELIVERY_FEE_DEFAULT;
    },

    async setDefaultDeliveryFee(fee) {
      const sb = await getClient();
      const res = await sb
        .from('app_settings')
        .upsert({
          key: 'delivery_fee_default',
          value: fee,
          updated_at: new Date().toISOString(),
        })
        .select('key')
        .single();
      check(res);
    },
  };
}
