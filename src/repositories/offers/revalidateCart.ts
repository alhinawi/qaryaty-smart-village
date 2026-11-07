import type{CartItem,Product}from'@/types';
import {applyProductOffer}from'./priceOffer';
import type{DailyOffer}from'./types';
import {GRILL_PRICE_PER_KILO}from'@/data/catalog';
import {formatCurrency}from'@/utils/helpers';
export function repriceCart(items:CartItem[],products:Product[],offers:DailyOffer[]):CartItem[]{return items.map(item=>{
  if(item.shopId==null||!item.productId)return item;
  const product=products.find(p=>p.id===item.productId);if(!product||product.available===false)throw Error('صنف في السلة مبقاش متاح، راجع السلة');
  const p=applyProductOffer(product,item.shopId,offers);const extra=item.grill?GRILL_PRICE_PER_KILO:0;
  return {...item,price:p.price+extra,originalPrice:p.originalPrice!=null?p.originalPrice+extra:undefined,offerId:p.offerId,offerEndsAt:p.offerEndsAt,formattedPrice:`${formatCurrency(p.price+extra)} / ${p.unit}`};
});}
export function cartPriceChanged(before:CartItem[],after:CartItem[]){return before.some((p,i)=>p.price!==after[i]?.price||p.offerId!==after[i]?.offerId);}
