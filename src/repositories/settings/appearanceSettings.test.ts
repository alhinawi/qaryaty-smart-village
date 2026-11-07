import { it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseSettingsRepo } from './supabaseSettingsRepo';
function fake(data: unknown, error: unknown=null) {const chain={select:vi.fn(),eq:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data,error}),upsert:vi.fn().mockResolvedValue({error})};chain.select.mockReturnValue(chain);chain.eq.mockReturnValue(chain);const from=vi.fn().mockReturnValue(chain);return {repo:createSupabaseSettingsRepo(async()=>({from}) as unknown as SupabaseClient),chain,from};}
it('missing live row is OFF, not implicit permission',async()=>{const{repo}=fake(null);expect(await repo.getAppearanceEnabled()).toBe(false);});
it('ON/OFF read explicit server values',async()=>{expect(await fake({value:1}).repo.getAppearanceEnabled()).toBe(true);expect(await fake({value:0}).repo.getAppearanceEnabled()).toBe(false);});
it('failed read rejects for the caller to fail closed',async()=>{await expect(fake(null,{message:'offline'}).repo.getAppearanceEnabled()).rejects.toThrow();});
it('writes only the existing app_settings key and checks rejection',async()=>{const{repo,chain,from}=fake(null);await repo.setAppearanceEnabled(false);expect(from).toHaveBeenCalledWith('app_settings');expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({key:'appearance_enabled',value:0}));await expect(fake(null,{message:'RLS denied'}).repo.setAppearanceEnabled(true)).rejects.toThrow();});
