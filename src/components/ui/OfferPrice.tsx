import{formatCurrency}from'@/utils/helpers';
/** One shared offer treatment across search, menu and checkout. */
export function OfferPrice({price,original,percent,unit}:{price:number;original?:number;percent?:number;unit?:string}){
const discounted=original!=null&&original>price;
const value=percent??(discounted?Math.round((1-price/original!)*100):undefined);
return <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1" aria-label={discounted?`السعر ${formatCurrency(price)} بدل ${formatCurrency(original)}، خصم ${value}%`:undefined}>
<strong className="text-green font-extrabold whitespace-nowrap">{formatCurrency(price)}</strong>
{discounted&&<><del className="text-text-muted font-normal whitespace-nowrap">{formatCurrency(original)}</del><span dir="ltr" className="inline-flex bg-green text-white rounded-md px-1.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap">-{value}%</span></>}
{unit&&<span className="text-text-muted font-normal">/ {unit}</span>}
</span>;
}
