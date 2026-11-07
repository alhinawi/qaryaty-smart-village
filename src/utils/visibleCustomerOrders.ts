import type {Order} from '@/types';
/** Display-only samples never survive demo OFF/unknown, including legacy local caches. */
export const visibleCustomerOrders=(orders:Order[],verifiedDemo:boolean)=>verifiedDemo?orders:orders.filter(order=>!order.id.startsWith('ord_demo_'));
