// ─── Imports
import { useCallback } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import type { CartItem } from '@/types';

/**
 * Adds to the cart, which holds one service or one place at a time. An item
 * from somewhere else asks first: empty the cart and start there, or cancel.
 * Resolves true when the item went in.
 */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);
  const ask = useConfirmStore((s) => s.ask);

  return useCallback(
    async (item: CartItem): Promise<boolean> => {
      const result = addItem(item);
      if (result.status === 'added') return true;

      const next = item.vendor?.name ?? item.name;
      const ok = await ask({
        title: 'السلة فيها طلب تاني',
        message: `السلة بتشيل طلب من مكان واحد بس، وفيها دلوقتي طلب من «${result.current}». تحب تفضّي السلة وتبدأ من «${next}»؟`,
        confirmLabel: 'فضّي السلة وابدأ من جديد',
        cancelLabel: 'إلغاء',
      });
      if (!ok) return false;
      addItem(item, true);
      return true;
    },
    [addItem, ask]
  );
}
