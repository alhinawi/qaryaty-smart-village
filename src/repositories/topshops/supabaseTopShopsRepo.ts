// ─── Weekly top shops on Supabase (see the weekly_top_shops migration;
// applies on owner OK). The SQL aggregates orders itself and honors the
// demo switch server-side.
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '@/repositories/errors';
import type { TopShopsRepo, WeeklyTopShop } from './types';

interface Row {
  shop_id: number;
  order_count: number;
}

export function createSupabaseTopShopsRepo(getClient: () => Promise<SupabaseClient>): TopShopsRepo {
  return {
    async listWeekly(limit) {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('weekly_top_shops', { p_limit: limit });
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب الترتيب', { cause: error });
      return (data as Row[]).map((row): WeeklyTopShop => ({ shopId: row.shop_id, orderCount: Number(row.order_count) }));
    },
  };
}
