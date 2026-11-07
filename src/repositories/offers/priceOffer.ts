import type {Product} from '@/types';
import type {DailyOffer} from './types';
/** Discount applies to product only, not optional grilling/delivery or fee rules. */
export function applyProductOffer(product:Product,shopId:number,offers:DailyOffer[],now=Date.now()):Product{
  const base=product.originalPrice??product.price;
  const clean={...product,price:base,originalPrice:undefined,offerId:undefined,offerEndsAt:undefined};
  const offer=offers.find(o=>o.shopId===shopId&&o.productId===product.id&&o.percentOff!=null&&o.percentOff>=1&&o.percentOff<=99&&Date.parse(o.startsAt??o.createdAt)<=now&&Date.parse(o.endsAt)>now);
  return offer?{...clean,price:Math.round(base*(100-offer.percentOff!))/100,originalPrice:base,offerId:offer.id,offerEndsAt:offer.endsAt}:clean;
}
