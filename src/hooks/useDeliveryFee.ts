import { useEffect, useState } from 'react';
import { quoteDeliveryFee } from '@/repositories';
import { DELIVERY_FEE_DEFAULT } from '@/config/delivery';
import { useUserStore } from '@/stores/useUserStore';

/**
 * رسوم التوصيل for a cart from this shop: the server's own number (the one the
 * order is charged), asked again when the shop or the customer's village changes.
 * 0 when there is no shop (a service cart never pays it).
 */
export function useDeliveryFee(shopId: number | undefined): number {
  const village = useUserStore((state) => state.profile.village);
  const [quote, setQuote] = useState<{ shopId: number; fee: number } | null>(null);

  useEffect(() => {
    if (shopId === undefined) return;
    let alive = true;
    quoteDeliveryFee(shopId)
      .then((fee) => alive && setQuote({ shopId, fee }))
      .catch(() => alive && setQuote({ shopId, fee: DELIVERY_FEE_DEFAULT }));
    return () => {
      alive = false;
    };
  }, [shopId, village]);

  if (shopId === undefined) return 0;
  return quote && quote.shopId === shopId ? quote.fee : DELIVERY_FEE_DEFAULT;
}
