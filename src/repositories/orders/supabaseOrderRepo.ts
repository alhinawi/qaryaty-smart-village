// ─── Orders saved in Supabase (table `orders`, see supabase/schema.sql)
// The id is made here so the insert needs no read-back: guests can order
// without being allowed to read the orders table.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getFormattedDate } from '@/utils/helpers';
import { RepoError } from '../errors';
import type { Order } from '@/types';
import type { NewOrder, OrderRepo } from './types';

const REJECTED_MESSAGE = 'الطلب اترفض، راجع البيانات وجرّب تاني';
const PROMO_USED_MESSAGE = 'كود QARYA1 لأول طلب بس، واتستخدم قبل كده على حسابك. شيل الكود وجرّب تاني';

/** Postgres said no (bad data, permission): a real answer, not an outage. */
export function isRejectedByDatabase(code: string | undefined): boolean {
  return !!code && /^(22|23|42)/.test(code);
}

export function orderToRow(id: string, input: NewOrder, userId: string | null) {
  return {
    id,
    user_id: userId,
    order_number: input.orderNumber,
    service_name: input.serviceName,
    service_emoji: input.serviceEmoji,
    address: input.address,
    phone: input.phone,
    // Where to deliver, picked on the map (orders.location_url opens it on Google Maps)
    ...(Number.isFinite(input.lat) && Number.isFinite(input.lng) ? { lat: input.lat, lng: input.lng } : {}),
    notes: input.notes ?? null,
    payment_method: input.paymentMethod,
    discount_code: input.discountCode ?? null,
    discount_amount: input.discountAmount,
    // The database sets the commission itself and adds it to the price, and works
    // out the coupon from the order before it (orders_before_insert)
    total_amount: input.couponBase ? input.couponBase.totalAmount : input.totalAmount,
    commission_amount: (input.couponBase ? input.couponBase.commissionAmount : input.commissionAmount) ?? 0,
    // رسوم التوصيل: the database sets its own value (orders_before_insert)
    delivery_fee: input.deliveryFee ?? 0,
    is_estimate: input.isEstimate ?? false,
    status: input.status,
    options: input.options ?? null,
    service_id: input.serviceId ?? null,
    provider_id: input.providerId ?? null,
    // The database prices these from its own product list (orders_before_insert)
    shop_id: input.shopId ?? null,
    items: input.items?.length
      ? input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity, grill: i.grill ?? false,expected_unit_price:i.expectedUnitPrice,expected_offer_id:i.offerId??null }))
      : null,
  };
}

/** Only customer-facing fields, never payment processor IDs or unrelated admin data. */
const HISTORY_FIELDS = 'id,user_id,order_number,service_name,service_emoji,address,phone,notes,payment_method,discount_code,discount_amount,total_amount,commission_amount,delivery_fee,is_estimate,status,options,service_id,provider_id,shop_id,items,payment_status,lat,lng,created_at';
export const ORDER_HISTORY_PAGE_SIZE = 50;

type OrderRow = {
  id: string; user_id: string | null; order_number: string; service_name: string;
  service_emoji: string; address: string; phone: string; notes: string | null;
  payment_method: Order['paymentMethod']; discount_code: string | null;
  discount_amount: number; total_amount: number | null; commission_amount: number;
  delivery_fee: number; is_estimate: boolean; status: Order['status'];
  options: Order['options'] | null; service_id: number | null; provider_id: number | null;
  shop_id: number | null; items: { product_id: string; quantity: number; grill?: boolean; original_unit_price?:number;unit_price?:number;offer_id?:number;offer_percent?:number }[] | null;
  payment_status: Order['paymentStatus']; lat: number | null; lng: number | null; created_at: string;
};

export function orderFromRow(row: OrderRow): Order {
  return {
    id: row.id, orderNumber: row.order_number, serviceName: row.service_name,
    serviceEmoji: row.service_emoji, address: row.address, phone: row.phone,
    notes: row.notes ?? undefined, paymentMethod: row.payment_method,
    discountCode: row.discount_code ?? undefined, discountAmount: Number(row.discount_amount),
    totalAmount: row.total_amount === null ? null : Number(row.total_amount),
    commissionAmount: Number(row.commission_amount), deliveryFee: Number(row.delivery_fee),
    isEstimate: row.is_estimate, status: row.status, options: row.options ?? undefined,
    serviceId: row.service_id ?? undefined, providerId: row.provider_id ?? undefined,
    shopId: row.shop_id ?? undefined,
    items: row.items?.map(i => ({ productId: String(i.product_id), quantity: i.quantity, grill: i.grill ?? false,originalUnitPrice:i.original_unit_price,unitPrice:i.unit_price,offerId:i.offer_id!=null?`offer_${i.offer_id}`:undefined,offerPercent:i.offer_percent })),
    paymentStatus: row.payment_status, lat: row.lat ?? undefined, lng: row.lng ?? undefined,
    createdAt: getFormattedDate(new Date(row.created_at)),
  };
}

export function createSupabaseOrderRepo(getClient: () => Promise<SupabaseClient>): OrderRepo {
  return {
    async listMine(ownerId, offset = 0) {
      const supabase = await getClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !ownerId || sessionData.session?.user.id !== ownerId) {
        throw new RepoError('rejected', 'سجّل دخول لحسابك عشان تشوف طلباتك');
      }
      const { data, error } = await supabase.from('orders').select(HISTORY_FIELDS)
        .eq('user_id', ownerId).order('created_at', { ascending: false })
        .order('id', { ascending: false }).range(offset, offset + ORDER_HISTORY_PAGE_SIZE - 1);
      if (error) throw error;
      // Defense in depth: even an unexpectedly broad response must not cross owners.
      return ((data ?? []) as OrderRow[]).filter(row => row.user_id === ownerId).map(orderFromRow);
    },
    async createOrder(input) {
      const supabase = await getClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const id = crypto.randomUUID();
      const { error } = await supabase
        .from('orders')
        .insert(orderToRow(id, input, sessionData.session?.user.id ?? null));
      if (error) {
        // The first-order code once per account (index orders_one_promo_per_user)
        if (error.code === '23505' && /one_promo/.test(error.message ?? '')) {
          throw new RepoError('rejected', PROMO_USED_MESSAGE, { cause: error });
        }
        // The coupon didn't pass the database's own check (orders_before_insert)
        const coupon = /^coupon: (.+)$/.exec(error.message ?? '');
        if (coupon) throw new RepoError('rejected', coupon[1], { cause: error });
        if (/OFFER_PRICE_CHANGED/.test(error.message??''))throw new RepoError('rejected','السعر أو العرض اتغيّر. اقفل السلة وافتحها وراجع السعر قبل التأكيد',{cause:error});
        if (isRejectedByDatabase(error.code)) throw new RepoError('rejected', REJECTED_MESSAGE, { cause: error });
        throw error;
      }
      const { couponBase: _base, couponEffect: _effect, ...order } = input;
      return { ...order, id, createdAt: getFormattedDate() };
    },
    async quoteDeliveryFee(shopId) {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('delivery_fee_quote', { p_shop_id: shopId });
      if (error) throw error;
      const fee = Number(data);
      if (data == null || !Number.isFinite(fee) || fee < 0) throw new Error('bad delivery fee');
      return fee;
    },
  };
}
