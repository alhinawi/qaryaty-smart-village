import { it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createPricesRepo } from './supabasePricesRepo';
function setup(result: {data?: unknown; error?: unknown} = { data: [], error: null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { rpc, repo: createPricesRepo(async () => ({ rpc }) as unknown as SupabaseClient) };
}
it('does not fabricate rows when RPC is unavailable', async () => { const {repo}=setup({error:new Error('missing migration')}); await expect(repo.list()).rejects.toThrow(); });
it('forwards narrow public projection without a mock fallback', async () => { const {repo,rpc}=setup();expect(await repo.list()).toEqual([]);expect(rpc).toHaveBeenCalledWith('list_daily_prices'); });
it('rejects bad input before reaching server', async () => { const {repo,rpc}=setup(); await expect(repo.publish(1,{item:'tomato',unit:'kg',price:NaN})).rejects.toThrow();expect(rpc).not.toHaveBeenCalled(); });
it('sends server only draft, not owner/date/source IDs', async () => { const {repo,rpc}=setup();await repo.publish(4,{item:' tomato ',unit:' kg ',price:12});expect(rpc).toHaveBeenCalledWith('publish_daily_price',{p_shop:4,p_item:'tomato',p_unit:'kg',p_price:12}); });
it('does not claim publication when rejected', async () => { const {repo}=setup({error:{message:'permission'}});await expect(repo.publish(4,{item:'tomato',unit:'kg',price:12})).rejects.toThrow('ماتنشرش'); });
it('withdraw uses server-owned authorization', async () => {const {repo,rpc}=setup();await repo.withdraw('real-id');expect(rpc).toHaveBeenCalledWith('withdraw_daily_price',{p_id:'real-id'});});
