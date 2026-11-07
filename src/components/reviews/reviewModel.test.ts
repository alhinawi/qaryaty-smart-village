import { describe,it,expect } from 'vitest';
import { reviewSummary,sortedReviews,type PublicReview } from './reviewModel';
const rows: PublicReview[] = [{id:'a',authorLabel:'أ',stars:5,text:'جيد',createdAt:'2026-11-01T10:00:00+02:00',completedOrder:true},{id:'b',authorLabel:'ب',stars:3,text:'',createdAt:'2026-11-02T10:00:00+02:00',completedOrder:true}];
describe('review list model',()=>{
  it('never manufactures an average for an empty list',()=>expect(reviewSummary([])).toMatchObject({count:0,average:null}));
  it('counts verified completions only and validates stars',()=>expect(reviewSummary([...rows,{...rows[0],completedOrder:false},{...rows[0],stars:8}])).toMatchObject({count:2,average:4}));
  it('sorts without mutating source',()=>{expect(sortedReviews(rows,'newest')[0].id).toBe('b');expect(sortedReviews(rows,'highest')[0].id).toBe('a');expect(sortedReviews(rows,'lowest')[0].id).toBe('b');expect(rows[0].id).toBe('a');});
  it('creates honest rating buckets',()=>expect(reviewSummary(rows).distribution.map(x=>x.count)).toEqual([1,0,1,0,0]));
});
