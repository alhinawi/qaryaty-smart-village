// ─── قسايم on Supabase: table public.coupons, functions my_coupons, coupon_quote,
// admin_coupons (supabase/migrations/20261106230000_coupons.sql)
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Coupon, CouponDraft, CouponKind, CouponTarget, MyCoupon } from '@/utils/coupons';
import { normalizeCouponCode } from '@/utils/coupons';
import { RepoError } from '../errors';
import type { AdminCoupon, CouponCheck, CouponRepo } from './types';

type Row = Record<string, unknown>;

const num = (v: unknown): number => (v == null ? 0 : Number(v));
const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

export function rowToCoupon(r: Row): Coupon {
  return {
    id: num(r.id),
    code: String(r.code),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    kind: r.kind as CouponKind,
    value: num(r.value),
    maxDiscount: numOrNull(r.max_discount),
    minOrder: num(r.min_order),
    appliesTo: r.applies_to as CouponTarget,
    shopId: numOrNull(r.shop_id),
    shopName: (r.shop_name as string | null | undefined) ?? null,
    firstOrderOnly: Boolean(r.first_order_only),
    perUserLimit: numOrNull(r.per_user_limit),
    totalLimit: numOrNull(r.total_limit),
    startsAt: (r.starts_at as string | null) ?? null,
    endsAt: (r.ends_at as string | null) ?? null,
    active: Boolean(r.active),
    isPublic: Boolean(r.is_public),
  };
}

function draftToRow(d: CouponDraft): Row {
  return {
    code: normalizeCouponCode(d.code),
    title: d.title.trim(),
    description: d.description.trim(),
    kind: d.kind,
    value: d.kind === 'percent' || d.kind === 'fixed' ? d.value : 0,
    max_discount: d.maxDiscount,
    min_order: d.minOrder,
    applies_to: d.appliesTo,
    shop_id: d.shopId,
    first_order_only: d.firstOrderOnly,
    per_user_limit: d.perUserLimit,
    total_limit: d.totalLimit,
    starts_at: d.startsAt,
    ends_at: d.endsAt,
    active: d.active,
    is_public: d.isPublic,
  };
}

function fail(error: { code?: string; message?: string }): never {
  if (error.code === '23505') throw new RepoError('rejected', 'فيه كوبون تاني بنفس الكود ده', { cause: error });
  if (error.code === '23514') throw new RepoError('rejected', 'فيه حاجة مش مظبوطة في بيانات الكوبون', { cause: error });
  if (error.code === '42501') throw new RepoError('rejected', 'الصفحة دي للإدارة بس', { cause: error });
  throw error;
}

export function createSupabaseCouponRepo(getClient: () => Promise<SupabaseClient>): CouponRepo {
  return {
    async listMine() {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('my_coupons');
      if (error) fail(error);
      return ((data as Row[] | null) ?? []).map(
        (r): MyCoupon => ({
          ...rowToCoupon(r),
          usedByMe: num(r.used_by_me),
          soldOut: Boolean(r.sold_out),
          hasOrders: Boolean(r.has_orders),
        })
      );
    },

    async check(input): Promise<CouponCheck> {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('coupon_quote', {
        p_code: input.code,
        p_target: input.target,
        p_shop_id: input.shopId,
        p_items: input.items,
      });
      if (error) fail(error);
      const r = (data ?? {}) as Row;
      if (!r.ok) return { ok: false, message: String(r.message ?? 'الكود ده مش صحيح') };
      const effect = {
        itemsOff: num(r.items_off),
        commissionOff: num(r.commission_off),
        deliveryOff: num(r.delivery_off),
        total: 0,
      };
      effect.total = effect.itemsOff + effect.commissionOff + effect.deliveryOff;
      return { ok: true, coupon: rowToCoupon(r.coupon as Row), effect };
    },

    async listAll() {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('admin_coupons');
      if (error) fail(error);
      return ((data as Row[] | null) ?? []).map(
        (r): AdminCoupon => ({
          ...rowToCoupon(r),
          uses: num(r.uses),
          users: num(r.users),
          saved: num(r.saved),
          lastUsedAt: (r.last_used_at as string | null) ?? null,
        })
      );
    },

    async save(draft, id) {
      const supabase = await getClient();
      const row = draftToRow(draft);
      const { error } =
        id == null
          ? await supabase.from('coupons').insert(row)
          : await supabase.from('coupons').update(row).eq('id', id);
      if (error) fail(error);
    },

    async setActive(id, active) {
      const supabase = await getClient();
      const { error } = await supabase.from('coupons').update({ active }).eq('id', id);
      if (error) fail(error);
    },
  };
}
