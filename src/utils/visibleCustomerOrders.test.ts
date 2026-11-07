import {describe,it,expect} from 'vitest';
import {visibleCustomerOrders} from './visibleCustomerOrders';
import {INITIAL_DEMO_ORDERS} from '@/stores/useOrderStore';
describe('sample orders respect verified demo mode',()=>{
 it('hides every legacy sample when demo is off/unknown',()=>expect(visibleCustomerOrders(INITIAL_DEMO_ORDERS,false)).toEqual([]));
 it('keeps samples when verified demo is on',()=>expect(visibleCustomerOrders(INITIAL_DEMO_ORDERS,true)).toEqual(INITIAL_DEMO_ORDERS));
 it('does not drop real orders',()=>{const real={...INITIAL_DEMO_ORDERS[0],id:'real-id'};expect(visibleCustomerOrders([real,...INITIAL_DEMO_ORDERS],false)).toEqual([real]);});
});
