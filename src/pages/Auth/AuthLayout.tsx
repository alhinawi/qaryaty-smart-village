// ─── Shared shell for /login and /register
import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/routes';
import { isSupabaseConfigured } from '@/repositories';
import { PhoneInput } from '@/components/ui/PhoneInput';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-linear-to-br from-green-dark to-green text-white rounded-2xl p-6 mb-5 text-center">
        <div className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center text-[28px] mx-auto mb-3" aria-hidden="true">
          🏡
        </div>
        <h2 className="text-[1.375rem] font-black font-['Tajawal',sans-serif]">{title}</h2>
        <p className="text-[13px] opacity-90 mt-1">{subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">{children}</div>

      <div className="text-center text-sm text-text-muted mt-4">{footer}</div>

      <p className="text-[11px] text-text-muted text-center mt-4 leading-relaxed" role={isSupabaseConfigured ? undefined : 'note'}>
        {/* Demo mode only: accounts live in this browser. Live accounts are saved on Supabase */}
        {!isSupabaseConfigured && <>تجريبي: الحساب متخزن على الجهاز ده بس لحد ما يبقى فيه سيرفر. </>}
        <Link to={ROUTES.home} className="text-green font-bold underline">
          رجوع للرئيسية
        </Link>
      </p>
    </div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

/** Input in the app's `.form-group` style with an accessible error message. */
export function AuthField({ id, label, error, hint, ...inputProps }: FieldProps) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint && !error && (
        <span id={`${id}-hint`} className="text-[11px] text-text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="input-error-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Phone input with the +20 box beside it, in the same `.form-group` style. */
export function PhoneField({ id, label, error, hint, ...inputProps }: Omit<FieldProps, 'type'>) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <PhoneInput
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint && !error && (
        <span id={`${id}-hint`} className="text-[11px] text-text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="input-error-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordField(props: Omit<FieldProps, 'type'>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      {/* Room on the left so a long password never runs under the toggle */}
      <AuthField
        {...props}
        type={visible ? 'text' : 'password'}
        dir="ltr"
        style={{ paddingLeft: '4.25rem', ...props.style }}
      />
      {/* A full 44px tap target, centred on the input */}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute left-1.5 top-[30px] h-11 min-w-11 px-3 rounded-lg text-xs font-bold text-green cursor-pointer hover:bg-green/5"
        aria-label={visible ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
        aria-pressed={visible}
      >
        {visible ? 'إخفاء' : 'إظهار'}
      </button>
    </div>
  );
}
