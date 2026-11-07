import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAddressRepo, rowToAddress } from './supabaseAddressRepo';

describe('address compatibility without optional SQL', () => {
  function setup(count: number) {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const row = { id:'a', label:'البيت', lat:31, lng:31, street:'', building:'', floor:'', landmark:'', phone:null, is_default:true, created_at:'' };
    const client = { rpc: vi.fn().mockResolvedValue({ error:{code:'PGRST202'} }), from: vi.fn(() => ({ select: () => ({order: async () => ({ data:Array.from({length:count}, (_,i)=>({...row,id:String(i)})), error:null })}), delete: () => ({eq:remove}) })) };
    return { repo:createSupabaseAddressRepo(async()=>client as unknown as SupabaseClient), remove, row };
  }
  it('does not turn legacy null coordinates into a valid zero location', () => {
    const {row}=setup(1);
    const address=rowToAddress({...row,lat:null,lng:null} as unknown as Parameters<typeof rowToAddress>[0]);
    expect(Number.isNaN(address.lat)).toBe(true);expect(Number.isNaN(address.lng)).toBe(true);
  });
  it('protects the last address if the new RPC is absent', async()=>{const {repo,remove}=setup(1);await expect(repo.remove('0')).rejects.toThrow('ضيف عنوان تاني');expect(remove).not.toHaveBeenCalled();});
  it('preserves deleting a non-last address on the existing table', async()=>{const {repo,remove}=setup(2);await repo.remove('0');expect(remove).toHaveBeenCalledWith('id','0');});
});
