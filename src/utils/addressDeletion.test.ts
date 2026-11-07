import { it, expect } from 'vitest';
import type { UserAddress } from '@/types';
import { canDeleteAddress } from './addressDeletion';
import { createLocalAddressRepo } from '@/repositories/addresses/localAddressRepo';
const a={id:'a',isDefault:true} as UserAddress,b={id:'b',isDefault:false} as UserAddress;
it('never deletes the last address or a missing ID',()=>{expect(canDeleteAddress([a],'a')).toBe(false);expect(canDeleteAddress([],'a')).toBe(false);expect(canDeleteAddress([a,b],'missing')).toBe(false);expect(canDeleteAddress([a,b],'a')).toBe(true);});
it('local repo guards last row and promotes remaining address',async()=>{const data=new Map<string,string>();const repo=createLocalAddressRepo({getItem:k=>data.get(k)??null,setItem:(k,v)=>void data.set(k,v),removeItem:k=>void data.delete(k)});const draft={label:'home',lat:31,lng:31,street:'street',building:'1',floor:'1',landmark:'',phone:''};const first=await repo.add(draft);await expect(repo.remove(first.id)).rejects.toThrow('ضيف عنوان');const second=await repo.add({...draft,label:'work'});await repo.remove(first.id);const rows=await repo.list();expect(rows).toHaveLength(1);expect(rows[0].id).toBe(second.id);expect(rows[0].isDefault).toBe(true);});
