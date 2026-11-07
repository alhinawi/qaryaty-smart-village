import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '@/repositories/errors';
import { validPriceDraft } from '@/utils/dailyPrices';
import type { DailyPrice, PricesRepo } from './types';
export function createPricesRepo(getClient: () => Promise<SupabaseClient>): PricesRepo {
  return {
    async list(shopId) {
      const client = await getClient();
      const { data, error } = shopId === undefined ? await client.rpc('list_daily_prices') : await client.rpc('list_daily_prices', { p_shop: shopId });
      if (error) throw new RepoError('unavailable', 'أسعار المحلات مش متاحة دلوقتي', { cause: error });
      return (data ?? []) as DailyPrice[];
    },
    async publish(shopId, draft) {
      if (!validPriceDraft(draft)) throw new RepoError('rejected', 'اكتب الصنف والوحدة وسعر صحيح أكبر من صفر');
      const client = await getClient();
      const { error } = await client.rpc('publish_daily_price', { p_shop: shopId, p_item: draft.item.trim(), p_unit: draft.unit.trim(), p_price: draft.price });
      if (error) throw new RepoError('rejected', 'السعر ماتنشرش. اتأكد من صلاحية إدارة المحل وجرب تاني', { cause: error });
    },
    async withdraw(id) {
      const client = await getClient();
      const { error } = await client.rpc('withdraw_daily_price', { p_id: id });
      if (error) throw new RepoError('rejected', 'السعر ماتشالش من اللوحة', { cause: error });
    },
  };
}
