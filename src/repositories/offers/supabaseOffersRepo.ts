// ─── Offers on Supabase (see the daily_offers migration; applies on owner OK)
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '@/repositories/errors';
import { isDemoMode } from '@/config/demoMode';
import type { DailyOffer, OffersRepo } from './types';

interface Row {
  id: number;
  product_id?:string|null;percent_off?:number|null;starts_at?:string|null;
  shop_id: number;
  title: string;
  details: string;
  ends_at: string;
  created_at: string;
  shops?: { name: string; photo: string | null }[] | { name: string; photo: string | null } | null;
}

function toOffer(row: Row): DailyOffer {
  return {
    id: `offer_${row.id}`,
    productId:row.product_id??undefined,percentOff:row.percent_off??undefined,startsAt:row.starts_at??undefined,
    shopId: row.shop_id,
    shopName: (Array.isArray(row.shops) ? row.shops[0]?.name : row.shops?.name) ?? '',
    shopPhoto: (Array.isArray(row.shops) ? row.shops[0]?.photo : row.shops?.photo) ?? undefined,
    title: row.title,
    details: row.details,
    endsAt: row.ends_at,
    createdAt: row.created_at,
  };
}

export function createSupabaseOffersRepo(getClient: () => Promise<SupabaseClient>): OffersRepo {
  return {
    async listActive() {
      const supabase = await getClient();
      // !inner lets us hide offers of hidden shops, and of demo shops in real mode
      let query = supabase
        .from('daily_offers')
        .select('id, shop_id, title, details, ends_at, created_at, product_id, percent_off, starts_at, shops!inner(name, photo, hidden, is_demo)')
        .is('stopped_at', null)
        .gt('ends_at', new Date().toISOString())
        .eq('shops.hidden', false);
      if (!isDemoMode()) query = query.eq('shops.is_demo', false);
      const { data, error } = await query.order('ends_at', { ascending: true }).limit(20);
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب العروض', { cause: error });
      return (data as Row[]).map(toOffer);
    },

    async mineForShop(shopId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('daily_offers')
        .select('id, shop_id, title, details, ends_at, created_at, product_id, percent_off, starts_at, shops(name, photo)')
        .eq('shop_id', shopId)
        .is('stopped_at', null)
        .gt('ends_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب عرض المحل', { cause: error });
      return data ? toOffer(data as Row) : null;
    },

    async create(shopId, _shopName, title, details, hours, discount) {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc('publish_product_offer', {
        p_shop_id:shopId,p_title:title.trim(),p_details:details.trim(),p_hours:hours,
        p_product_id:discount?.productId??null,p_percent_off:discount?.percentOff??null,
      });
      if (error) throw new RepoError('rejected', 'العرض ماتحفظش — اتأكد إن المحل بتاعك', { cause: error });
      return toOffer((Array.isArray(data)?data[0]:data) as Row);
    },

    async stop(offerId) {
      const supabase = await getClient();
      const {error}=await supabase.rpc('stop_product_offer',{p_offer_id:Number(offerId.replace('offer_',''))});
      if (error) throw new RepoError('unavailable', 'ماقدرناش نوقف العرض', { cause: error });
    },
  };
}
