// ─── /login
import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { AuthError } from '@/repositories';
import { fieldErrorsFrom, loginSchema } from '@/utils/validators';
import { ROUTES } from '@/routes';
import { useRedirectTarget } from '@/hooks/useRedirectTarget';
import { AuthField, AuthLayout, PasswordField } from './AuthLayout';

export default function LoginPage() {
  const session = useAuthStore((s) => s.session);
  const login = useAuthStore((s) => s.login);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const activated = new URLSearchParams(location.search).has('activated');
  // The activation link lands here with the session tokens in the #hash: drop them from the
  // address bar and history (the customer signs in with email and password right after)
  React.useEffect(() => {
    if (activated && /access_token|error_description/.test(window.location.hash)) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }, [activated]);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session && !submitting) return <Navigate to={target} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error.issues));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const user = await login(parsed.data);
      showToast(`👋 أهلاً يا ${user.name.split(' ')[0]}!`);
      navigate(target, { replace: true });
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'حصلت مشكلة، حاول تاني');
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="تسجيل الدخول"
      subtitle={activated ? '✅ حسابك اتفعّل، سجّل دخول بالإيميل وكلمة السر' : 'ادخل بالإيميل عشان تتابع طلباتك ونقطك'}
      footer={
        <>
          ماعندكش حساب؟{' '}
          <Link to={ROUTES.register} state={location.state} className="text-green font-bold">
            اعمل حساب جديد
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" aria-label="تسجيل الدخول">
        <AuthField
          id="loginEmail"
          label="الإيميل"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          placeholder="name@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          id="loginPassword"
          label="كلمة السر"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        {formError && (
          <p className="input-error-msg text-center" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting}>
          دخول
        </Button>

        <button
          type="button"
          className="text-xs text-text-muted underline self-center min-h-11 px-3 cursor-pointer"
          onClick={() => showToast('نسيت كلمة السر هتشتغل لما نضيف كود التأكيد بالـ SMS')}
        >
          نسيت كلمة السر؟
        </button>
      </form>
    </AuthLayout>
  );
}
