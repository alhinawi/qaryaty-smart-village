// ─── /register
import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { AuthError, authRepo } from '@/repositories';
import { fieldErrorsFrom, normalizeEgyptianPhone, registerSchema, usernameSchema } from '@/utils/validators';
import { ROUTES } from '@/routes';
import { AuthField, AuthLayout, PasswordField, PhoneField } from './AuthLayout';
import { GoogleAuthButton } from './GoogleAuthButton';
import { useRedirectTarget } from '@/hooks/useRedirectTarget';
import { VILLAGES } from '@/data/villages';
import AddressPickerField from '@/components/address/AddressPickerField';
import LocationPicker from '@/components/address/LocationPicker';
import { formatAddress } from '@/utils/address';
import { isSupabaseConfigured } from '@/repositories';
import { useAddressStore } from '@/stores/useAddressStore';
import type { AddressDraft } from '@/types';

const EMPTY = {
  name: '',
  username: '',
  email: '',
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
  const [sentTo, setSentTo] = useState('');
  const [mapAddress, setMapAddress] = useState<AddressDraft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  /** The username last confirmed free, so the hint shows only while it is still typed. */
  const [freeUsername, setFreeUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  if (session && !submitting) return <Navigate to={target} replace />;

  if (sentTo) {
    return (
      <AuthLayout
        title="فعّل حسابك من الإيميل"
        subtitle="خطوة واحدة وتبدأ تطلب"
        footer={
          <Link to={ROUTES.login} state={location.state} className="text-green font-bold">
            فعّلت؟ سجّل دخول
          </Link>
        }
      >
        <div className="flex flex-col gap-3 text-center" role="status">
          <p className="text-4xl" aria-hidden="true">📧</p>
          <p className="font-bold">بعتنالك إيميل تفعيل على</p>
          <p className="font-bold text-green" dir="ltr">{sentTo}</p>
          <p className="text-sm text-text-muted">
            افتح الإيميل واضغط على لينك التفعيل، وبعدها سجّل دخول بالإيميل وكلمة السر. لو مش لاقيه، بص في الـ Spam.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  /** On leaving the field: check the rules, then ask whether the name is free. */
  const checkUsername = async () => {
    const parsed = usernameSchema.safeParse(values.username);
    if (!parsed.success) {
      if (values.username.trim()) setErrors((e) => ({ ...e, username: parsed.error.issues[0].message }));
      return;
    }
    const wanted = parsed.data;
    setCheckingUsername(true);
    try {
      const free = await authRepo.isUsernameAvailable(wanted);
      setFreeUsername(free ? wanted : '');
      setErrors(({ username: _old, ...rest }) =>
        free ? rest : { ...rest, username: 'اسم المستخدم ده محجوز لحد تاني، جرّب اسم تاني' }
      );
    } catch {
      // Can't tell right now; the sign-up checks again
    } finally {
      setCheckingUsername(false);
    }
  };

  const usernameHint = checkingUsername
    ? 'بنشوف الاسم متاح ولا لأ…'
    : freeUsername && usernameSchema.safeParse(values.username).data === freeUsername
      ? `✓ الاسم متاح، هيظهر كده: @${freeUsername}`
      : 'بالإنجليزي: حروف وأرقام و _ من 3 لـ 20 حرف. مش هتقدر تغيّره بعدين';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parsed = registerSchema.safeParse({ ...values, location: mapAddress ?? undefined });
    if (!parsed.success || !mapAddress) {
      const fieldErrors = parsed.success ? {} : fieldErrorsFrom(parsed.error.issues);
      if (!mapAddress) fieldErrors.address = 'حدّد عنوانك على الخريطة علشان المندوب يوصلك';
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await register(parsed.data);
      if ('confirmEmail' in result) {
        setSentTo(result.confirmEmail);
        setSubmitting(false);
        return;
      }
      // Supabase saves the first address from the sign-up; the demo mode keeps it on this device
      if (!isSupabaseConfigured && parsed.data.location) {
        await useAddressStore.getState().save(parsed.data.location, undefined, true).catch(() => undefined);
      }
      showToast(`🎉 أهلاً بيك في قريتي يا ${result.user.name.split(' ')[0]}!`);
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.code === 'username_taken') {
        setFreeUsername('');
        setErrors({ username: err.message });
      } else if (err instanceof AuthError && err.code === 'email_taken') {
        setErrors({ email: err.message });
      } else if (err instanceof AuthError && err.code === 'phone_taken') {
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
      <GoogleAuthButton returnTo={target} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" aria-label="حساب جديد">
        <AuthField id="regName" label="الاسم بالكامل" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
        <AuthField
          id="regUsername"
          label="اسم المستخدم"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          dir="ltr"
          placeholder="ahmed_10"
          maxLength={21}
          hint={usernameHint}
          value={values.username}
          onChange={(e) => {
            set('username')(e);
            if (errors.username) setErrors(({ username: _old, ...rest }) => rest);
          }}
          onBlur={checkUsername}
          error={errors.username}
        />
        <AuthField
          id="regEmail"
          label="الإيميل"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          placeholder="name@gmail.com"
          hint="هنبعتلك عليه إيميل تفعيل الحساب"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
        />
        <PhoneField
          id="regPhone"
          label="رقم الموبايل"
          value={values.phone}
          onChange={set('phone')}
          error={errors.phone}
        />
        <AuthField
          id="regVillage"
          label="القرية"
          placeholder="مثال: منية سندوب"
          list="regVillageList"
          value={values.village}
          onChange={set('village')}
          error={errors.village}
        />
        <datalist id="regVillageList">
          {VILLAGES.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
        <AddressPickerField
          id="regAddress"
          label="العنوان في القرية"
          value={mapAddress}
          onOpen={() => setPickerOpen(true)}
          error={errors.address}
        />
        <LocationPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          initial={mapAddress}
          village={values.village}
          defaultPhone={normalizeEgyptianPhone(values.phone)}
          saveLabel="تمام، ده عنواني"
          onSave={(draft) => {
            setMapAddress(draft);
            setValues((v) => ({ ...v, address: formatAddress(draft).slice(0, 120) }));
            setErrors((er) => ({ ...er, address: '' }));
            setPickerOpen(false);
          }}
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
