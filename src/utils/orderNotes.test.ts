import {describe,it,expect} from 'vitest';
import {notificationOrderNote} from './orderNotes';
describe('order note notifications',()=>{
 it('does not invent a note',()=>{expect(notificationOrderNote()).toBe('');expect(notificationOrderNote('  ')).toBe('');});
 it('keeps food instructions intact',()=>expect(notificationOrderNote('بدون بصل، والشطة على جنب')).toContain('بدون بصل، والشطة على جنب'));
 it('makes truncation explicit rather than silently losing instructions',()=>{const result=notificationOrderNote('س'.repeat(1100));expect(result).toContain('باقي الملاحظات');expect(result.length).toBeLessThan(1100);});
});
