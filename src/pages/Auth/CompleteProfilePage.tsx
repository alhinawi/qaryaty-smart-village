// ─── /complete-profile: after the first Google sign-in
// Google gives us the name and email only. Before ordering, the customer picks a
// username (once, like the register page) and gives a phone and a village.
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { AuthError, authRepo, needsProfileCompletion } from '@/repositories';
import { completeProfileSchema, fieldErrorsFrom, usernameSchema } from '@/utils/validators';
import { ROUTES } from '@/routes';
import { useRedirectTarget } from '@/hooks/useRedirectTarget';
import { VILLAGES } from '@/data/villages';
import { AuthField, AuthLayout } from './AuthLayout';
import AddressPickerField from '@/components/address/AddressPickerField';
import LocationPicker from '@/components/address/LocationPicker';
import { formatAddress } from '@/utils/address';
import { useAddressStore } from '@/stores/useAddressStore';
import type { AddressDraft } from '@/types';


export default function CompleteProfilePage() {
  const session = useAuthStore((s) => s.session);
  const completeProfile = useAuthStore((s) => s.completeProfile);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const user = session?.user;

  const [values, setValues] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
    phone: user?.phone ?? '',
    village: user?.village ?? '',
    address: user?.address ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [freeUsername, setFreeUsername] = useState('');
  const [mapAddress, setMapAddress] = useState<AddressDraft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (!needsProfileCompletion(user) && !submitting) return <Navigate to={target} replace />;

  // Already set ones (an older account) stay as they are
  const hasUsername = Boolean(user.username);
  const hasPhone = Boolean(user.phone);

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const checkUsername = async () => {
    const parsed = usernameSchema.safeParse(values.username);
    if (!parsed.success) {
      if (values.username.trim()) setErrors((e) => ({ ...e, username: parsed.error.issues[0].message }));
      return;
    }
    setCheckingUsername(true);
    try {
      const free = await authRepo.isUsernameAvailable(parsed.data);
      setFreeUsername(free ? parsed.data : '');
      setErrors(({ username: _old, ...rest }) =>
        free ? rest : { ...rest, username: 'اسم المستخدم ده محجوز لحد تاني، جرّب اسم تاني' }
      );
    } catch {
      // Can't tell right now; saving checks again
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
    const parsed = completeProfileSchema.safeParse({
      ...values,
      // Fields already on the account pass as they are
      username: hasUsername ? user.username : values.username,
      phone: hasPhone ? user.phone : values.phone,
    });
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error.issues));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const saved = await completeProfile(parsed.data);
      // The spot on the map becomes the first saved address (عناويني)
      if (mapAddress) {
        await useAddressStore.getState().save(mapAddress, undefined, true).catch(() => undefined);
      }
      showToast(`🎉 أهلاً بيك في قريتي يا ${saved.name.split(' ')[0]}!`);
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.code === 'username_taken') {
        setFreeUsername('');
        setErrors({ username: err.message });
      } else {
        setFormError(err instanceof AuthError ? err.message : 'حصلت مشكلة، حاول تاني');
      }
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="كمّل بياناتك"
      subtitle="خطوة واحدة وتبدأ تطلب: المندوب محتاج رقمك وقريتك"
      footer={
        <button
          type="button"
          className="text-text-muted underline min-h-11 px-3 cursor-pointer"
          onClick={() => {
            void logout();
            navigate(ROUTES.home, { replace: true });
          }}
        >
          مش دلوقتي، اخرج من الحساب
        </button>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" aria-label="كمّل بياناتك">
        {user.email && (
          <p className="text-xs text-text-muted text-center">
            داخل بحساب جوجل: <span dir="ltr" className="font-bold">{user.email}</span>
          </p>
        )}
        <AuthField id="cpName" label="الاسم بالكامل" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
        {!hasUsername && (
          <AuthField
            id="cpUsername"
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
        )}
        {!hasPhone && (
          <AuthField
            id="cpPhone"
            label="رقم الموبايل"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01012345678"
            value={values.phone}
            onChange={set('phone')}
            error={errors.phone}
          />
        )}
        <AuthField
          id="cpVillage"
          label="القرية"
          placeholder="مثال: منية سندوب"
          list="cpVillageList"
          value={values.village}
          onChange={set('village')}
          error={errors.village}
        />
        <datalist id="cpVillageList">
          {VILLAGES.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
        <AddressPickerField
          id="cpAddress"
          label="العنوان في القرية (اختياري)"
          value={mapAddress}
          onOpen={() => setPickerOpen(true)}
          error={errors.address}
        />
        <LocationPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          initial={mapAddress}
          village={values.village}
          defaultPhone={hasPhone ? user.phone : values.phone}
          saveLabel="تمام، ده عنواني"
          onSave={(draft) => {
            setMapAddress(draft);
            setValues((v) => ({ ...v, address: formatAddress(draft).slice(0, 120) }));
            setErrors((er) => ({ ...er, address: '' }));
            setPickerOpen(false);
          }}
        />

        {formError && (
          <p className="input-error-msg text-center" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting}>
          حفظ وكمّل
        </Button>
      </form>
    </AuthLayout>
  );
}
