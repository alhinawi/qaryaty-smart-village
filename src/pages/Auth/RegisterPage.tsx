// ─── /register
import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { AuthError } from '@/repositories';
import { fieldErrorsFrom, registerSchema } from '@/utils/validators';
import { ROUTES } from '@/routes';
import { AuthField, AuthLayout, PasswordField } from './AuthLayout';
import { useRedirectTarget } from '@/hooks/useRedirectTarget';

const EMPTY = {
  name: '',
  phone: '',
  village: '',
  address: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const session = useAuthStore((s) => s.session);
  const register = useAuthStore((s) => s.register);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();
  const location = useLocation();
  const target = useRedirectTarget();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session && !submitting) return <Navigate to={target} replace />;

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error.issues));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const user = await register(parsed.data);
      showToast(`🎉 أهلاً بيك في قريتي يا ${user.name.split(' ')[0]}!`);
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.code === 'phone_taken') {
        setErrors({ phone: err.message });
      } else {
        setFormError(err instanceof AuthError ? err.message : 'حصلت مشكلة، حاول تاني');
      }
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="حساب جديد"
      subtitle="سجّل مرة واحدة وبياناتك هتتملى لوحدها في كل طلب"
      footer={
        <>
          عندك حساب؟{' '}
          <Link to={ROUTES.login} state={location.state} className="text-green font-bold">
            سجّل دخول
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" aria-label="حساب جديد">
        <AuthField id="regName" label="الاسم بالكامل" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
        <AuthField
          id="regPhone"
          label="رقم الموبايل"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01012345678"
          value={values.phone}
          onChange={set('phone')}
          error={errors.phone}
        />
        <AuthField
          id="regVillage"
          label="القرية"
          placeholder="مثال: قرية البركة"
          value={values.village}
          onChange={set('village')}
          error={errors.village}
        />
        <AuthField
          id="regAddress"
          label="العنوان في القرية"
          autoComplete="street-address"
          placeholder="الشارع، علامة مميزة"
          value={values.address}
          onChange={set('address')}
          error={errors.address}
        />
        <PasswordField
          id="regPassword"
          label="كلمة السر"
          autoComplete="new-password"
          hint="8 حروف على الأقل، فيهم حرف ورقم"
          value={values.password}
          onChange={set('password')}
          error={errors.password}
        />
        <PasswordField
          id="regConfirm"
          label="أكّد كلمة السر"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
        />

        {formError && (
          <p className="input-error-msg text-center" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting}>
          اعمل الحساب
        </Button>
      </form>
    </AuthLayout>
  );
}
