import { describe,it,expect } from 'vitest';
import { validRecipient } from './validation';
const recipient={name:'مستلم معاينة',village:'منية سندوب',address:'عنوان تجريبي طويل للمعاينة',phone:'01000000000'};
describe('recipient delivery details',()=>{
 it('accepts complete Egyptian delivery fields',()=>expect(validRecipient(recipient)).toBe(true));
 it('rejects incomplete and invalid details',()=>{for(const [k,v] of [['name',''],['village',''],['address','قصير'],['phone','+12001234567'],['phone','123']])expect(validRecipient({...recipient,[k]:v})).toBe(false);});
});
