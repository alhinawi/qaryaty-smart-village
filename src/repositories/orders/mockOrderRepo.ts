// ─── Demo orders: kept on this device only (useOrderStore persists them)
import { getFormattedDate } from '@/utils/helpers';
import { DELIVERY_FEE_DEFAULT } from '@/config/delivery';
import {SHOPS} from '@/data/shops';
import {productsForShop,GRILL_PRICE_PER_KILO} from '@/data/catalog';
import {isTrackingDemoMode} from '@/config/demoMode';
import {createLocalOffersRepo} from '@/repositories/offers/localOffersRepo';
import {applyProductOffer} from '@/repositories/offers/priceOffer';
import {appCommission} from '@/utils/pricing';
import type { OrderRepo } from './types';

export function createMockOrderRepo(scope='guest'): OrderRepo {
  return {
    async listMine() { return []; },
    async createOrder(input) {
      if(input.shopId!=null&&input.items?.length){
        if(!isTrackingDemoMode())throw Error('الطلب المحلي متاح في وضع التجربة بس');
        const shop=SHOPS.find(s=>s.id===input.shopId);const products=shop?productsForShop(shop):null;
        const offers=await createLocalOffersRepo(scope).listActive();
        const items=input.items.map(line=>{const raw=products?.find(p=>p.id===line.productId);if(!raw||raw.viewOnly||raw.available===false)throw Error('الصنف مش متاح');
          if(!Number.isFinite(line.quantity)||line.quantity<=0||line.quantity>100||Math.abs(line.quantity/raw.step-Math.round(line.quantity/raw.step))>0.00001||line.grill&&!raw.grillable)throw Error('راجع كمية الصنف وطريقة التجهيز');
          const p=applyProductOffer(raw,input.shopId!,offers);const extra=line.grill?GRILL_PRICE_PER_KILO:0;const unit=p.price+extra;
          if(line.expectedUnitPrice!==unit||line.offerId!==p.offerId)throw Error('السعر أو العرض اتغيّر. راجع السلة وأكد تاني');
          return {...line,originalUnitPrice:(p.originalPrice??p.price)+extra,unitPrice:unit,offerId:p.offerId};
        });
        if(!isTrackingDemoMode())throw Error('المحاكاة متوقفة');
        const subtotal=Math.round(items.reduce((s,l)=>s+l.unitPrice*l.quantity,0)*100)/100;
        const fee=appCommission({payable:subtotal,isEstimate:false});const waived=input.discountCode==='QARYA1';
        return {...input,items,totalAmount:subtotal+(waived?0:fee)+DELIVERY_FEE_DEFAULT,commissionAmount:waived?0:fee,discountAmount:waived?fee:0,deliveryFee:DELIVERY_FEE_DEFAULT,id:`ord_demo_local_${Date.now()}`,createdAt:getFormattedDate()};
      }
      return { ...input, id: `ord_${Date.now()}`, createdAt: getFormattedDate() };
    },
    async quoteDeliveryFee() {
      return DELIVERY_FEE_DEFAULT;
    },
  };
}
