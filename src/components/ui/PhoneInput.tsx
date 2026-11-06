// ─── Phone number with the country code beside it, like Talabat's رقم الهاتف الجوال
// Egypt only (+20): delivery, the wallet and the checks are all Egyptian. The number
// may be typed with or without its 0 (1012345678 or 01012345678) and is always
// saved as 01xxxxxxxxx by normalizeEgyptianPhone().
import React from 'react';

export type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

function EgyptFlag() {
  return (
    <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true" className="rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)] shrink-0">
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#ce1126" />
      <rect y="13.33" width="30" height="6.67" fill="#000" />
      <circle cx="15" cy="10" r="2.2" fill="#c09300" />
    </svg>
  );
}

/** The input only: put it inside the form's own label and error markup. */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className = '', placeholder = '010 1234 5678', ...props }, ref) => (
    <div className="phone-field" dir="ltr">
      <span className="phone-cc" title="مصر" aria-label="مصر +20">
        <EgyptFlag />
        <span dir="ltr">+20</span>
      </span>
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={16}
        placeholder={placeholder}
        className={className}
        {...props}
      />
    </div>
  )
);

PhoneInput.displayName = 'PhoneInput';
