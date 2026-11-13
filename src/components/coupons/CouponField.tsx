// ─── The coupon field in the cart and the order form, with a link to قسايمي
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes';
import type { useCouponField } from '@/hooks/useCouponField';

export function CouponField({
  id,
  field,
  onOpenCoupons,
}: {
  id: string;
  field: ReturnType<typeof useCouponField>;
  /** Closes the cart or the form before going to قسايمي. */
  onOpenCoupons?: () => void;
}) {
  const { code, setCode, applied, message, checking, apply, clear } = field;
  // Not a <form>: the order screen's step is a form already, and forms can't nest
  const press = () => {
    if (applied) clear();
    else void apply();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (!applied) void apply();
  };
  return (
    <div className="form-group mb-4">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id}>🎟️ كوبون خصم</label>
        <Link
          to={ROUTES.coupons}
          onClick={onOpenCoupons}
          className="text-[13px] font-bold text-green no-underline whitespace-nowrap"
        >
          شوف قسايمك ←
        </Link>
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          dir="ltr"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="اكتب الكود"
          value={code}
          maxLength={20}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={onKeyDown}
          disabled={!!applied || checking}
          aria-invalid={message ? !message.ok : undefined}
          aria-describedby={message ? `${id}-msg` : undefined}
          className="flex-1 uppercase tracking-wider text-right placeholder:text-right"
        />
        <Button type="button" variant={applied ? 'outline' : 'gold'} size="sm" disabled={checking} onClick={press}>
          {checking ? 'لحظة…' : applied ? 'شيله' : 'تطبيق'}
        </Button>
      </div>
      {message && (
        <p
          id={`${id}-msg`}
          role={message.ok ? 'status' : 'alert'}
          className={`m-0 mt-1.5 text-[13px] font-bold ${message.ok ? 'text-success' : 'text-red-600'}`}
        >
          {message.ok ? '✅ ' : '⚠️ '}
          {message.text}
        </p>
      )}
    </div>
  );
}
