// ─── Orders saved in Supabase (table `orders`, see supabase/schema.sql)
// The id is made here so the insert needs no read-back: guests can order
// without being allowed to read the orders table.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getFormattedDate } from '@/utils/helpers';
import { RepoError } from '../errors';
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
    // The database sets the commission itself and adds it to the price (orders_before_insert)
    total_amount: input.totalAmount,
    commission_amount: input.commissionAmount ?? 0,
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
      ? input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity, grill: i.grill ?? false }))
      : null,
  };
}

export function createSupabaseOrderRepo(getClient: () => Promise<SupabaseClient>): OrderRepo {
  return {
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
        if (isRejectedByDatabase(error.code)) throw new RepoError('rejected', REJECTED_MESSAGE, { cause: error });
        throw error;
      }
      return { ...input, id, createdAt: getFormattedDate() };
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
