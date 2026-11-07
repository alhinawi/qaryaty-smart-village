import {describe,it,expect,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createReviewsRepo} from './supabaseReviewsRepo';
function setup(data:unknown=null,error:unknown=null){const rpc=vi.fn().mockResolvedValue({data,error});return {rpc,repo:createReviewsRepo(async()=>({rpc}) as unknown as SupabaseClient)};}
describe('reviews RPC contract without fictional fallbacks',()=>{
 it('sends only order, rating, text and consented name on submit',async()=>{const{rpc,repo}=setup('id');await repo.submit('order',4,'good','أحمد');expect(rpc).toHaveBeenCalledWith('submit_review',{p_order:'order',p_stars:4,p_body:'good',p_name:'أحمد'});});
 it('passes keyset cursor and server sort',async()=>{const{rpc,repo}=setup({rows:[],count:0,average:null,distribution:[0,0,0,0,0]});await repo.list('shop',1,'lowest',{id:'cursor',stars:3,text:'',authorLabel:'x',createdAt:'date',completedOrder:true});expect(rpc).toHaveBeenCalledWith('list_public_reviews',{p_kind:'shop',p_target:1,p_sort:'lowest',p_cursor_time:'date',p_cursor_id:'cursor',p_cursor_stars:3});});
 it('fails rather than inventing reviews on server error',async()=>{const{repo}=setup(null,{message:'private secret provider error'});await expect(repo.list('provider',2)).rejects.toThrow('ماقدرناش');await expect(repo.list('provider',2)).rejects.not.toThrow('private secret');});
 it('does not swallow submit failures as success',async()=>{const{repo}=setup(null,{code:'42501'});await expect(repo.submit('order',5,'','')).rejects.toThrow();});
 it('calls narrow report and moderation RPCs only',async()=>{const{rpc,repo}=setup();await repo.report('review','personal');await repo.moderate('review',false,'private data');expect(rpc).toHaveBeenCalledWith('report_review',{p_review:'review',p_reason:'personal'});expect(rpc).toHaveBeenCalledWith('moderate_review',{p_review:'review',p_publish:false,p_reason:'private data'});});
 it('loads own status and admin queue through separate functions',async()=>{const{rpc,repo}=setup([]);await repo.mine();await repo.queue();expect(rpc).toHaveBeenCalledWith('my_order_reviews',undefined);expect(rpc).toHaveBeenCalledWith('review_moderation_queue',undefined);});
});
