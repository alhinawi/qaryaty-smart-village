// ─── The coupon field in the cart and the order form: checks the code against the
// coupons table (the database checks it again when the order is saved).
import { useCallback, useEffect, useRef, useState } from 'react';
import { couponRepo } from '@/repositories';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCouponStore } from '@/stores/useCouponStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUserStore } from '@/stores/useUserStore';
import { hasRealOrders } from '@/utils/pricing';
import { normalizeCouponCode, type Coupon, type OrderMoney } from '@/utils/coupons';

export interface AppliedCoupon {
  code: string;
  coupon: Coupon;
}

/** `enabled: false` while the form can't take a coupon yet (a waiting قسايمي code stays waiting). */
export function useCouponField(money: OrderMoney & { enabled?: boolean }) {
  const signedIn = useAuthStore((s) => Boolean(s.session));
  const orders = useOrderStore((s) => s.orders);
  const usedCodes = useUserStore((s) => s.usedPromoCodes);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const moneyRef = useRef(money);
  moneyRef.current = money;

  const device = useCallback(
    () => ({ signedIn, hasOrders: hasRealOrders(orders), usedCodes }),
    [signedIn, orders, usedCodes]
  );

  /** Checks a code for the order as it is now. Returns the coupon, or null with the reason shown. */
  const apply = useCallback(
    async (raw?: string): Promise<AppliedCoupon | null> => {
      const value = normalizeCouponCode(raw ?? code);
      if (raw !== undefined) setCode(value);
      if (!value) {
        setMessage({ ok: false, text: 'اكتب الكود الأول' });
        return null;
      }
      setChecking(true);
      try {
        const { enabled: _enabled, ...orderMoney } = moneyRef.current;
        const result = await couponRepo.check({ ...orderMoney, code: value, device: device() });
        if (!result.ok) {
          setApplied(null);
          setMessage({ ok: false, text: result.message });
          return null;
        }
        const next = { code: value, coupon: result.coupon };
        setApplied(next);
        setMessage({ ok: true, text: `اتفعّل: ${result.coupon.title}` });
        return next;
      } catch (err) {
        setApplied(null);
        setMessage({ ok: false, text: err instanceof Error ? err.message : 'ماقدرناش نتأكد من الكود، جرّب تاني' });
        return null;
      } finally {
        setChecking(false);
      }
    },
    [code, device]
  );

  const clear = useCallback(() => {
    setApplied(null);
    setMessage(null);
    setCode('');
  }, []);

  // A coupon picked on قسايمي ("استخدمها") goes on by itself
  const takePending = useCouponStore((s) => s.takePendingCode);
  const pending = useCouponStore((s) => s.pendingCode);
  useEffect(() => {
    if (!pending || money.enabled === false) return;
    const value = takePending();
    if (value) void apply(value);
  }, [pending, money.enabled, takePending, apply]);

  // The order changed (items, shop) under an applied coupon: check it again
  const key = `${money.target}|${money.shopId}|${money.items}|${money.delivery}`;
  const lastKey = useRef(key);
  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    if (applied) void apply(applied.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { code, setCode, applied, message, checking, apply, clear };
}
