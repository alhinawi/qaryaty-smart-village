import { describe, expect, it, vi } from 'vitest';
import { setDemoModeFlag } from '@/config/demoMode';
import { createSupabaseCatalogRepo } from './supabaseCatalogRepo';

describe('live catalog creation provenance payload',()=>{
  for(const mode of [true,false]) it(`captures ${mode} before async client acquisition and owner-column retry`,async()=>{
    setDemoModeFlag(mode);let inserted:Record<string,unknown>[]=[];
    const client={from:()=>{const builder={select:()=>builder,order:()=>builder,limit:async()=>({data:[{id:1}],error:null}),insert:(row:Record<string,unknown>)=>{inserted.push(row);return{select:()=>({single:async()=>inserted.length%2?{error:{message:'owner_profile_id missing'},data:null}:{error:null,data:{...row,id:2}}})}}};return builder;}};
    const getClient=vi.fn(async()=>{setDemoModeFlag(!mode);return client as never});
    const repo=createSupabaseCatalogRepo(getClient);
    await repo.addShop({name:'shop',kind:'grocery',description:''});expect(inserted).toHaveLength(2);expect(inserted.every(row=>row.is_demo===mode)).toBe(true);
    inserted=[];setDemoModeFlag(mode);
    await repo.addProvider({name:'provider',kind:'worker',serviceId:1,gender:'male',role:'x',village:'',area:'',price:'',bio:''});expect(inserted).toHaveLength(2);expect(inserted.every(row=>row.is_demo===mode)).toBe(true);
  });
});
