// ─── Before a Google account's first order: phone, village and the address on the map
// Like Talabat, signing in with Google lets you straight in; this is asked only when
// you place an order. The username is made from the email, nobody picks one.
// The address is required: the spot on the map becomes the default in عناويني.
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAddressStore } from '@/stores/useAddressStore';
import { AuthError } from '@/repositories';
import { completeProfileSchema, fieldErrorsFrom, normalizeEgyptianPhone } from '@/utils/validators';
import { VillagePicker } from '@/components/address/VillagePicker';
import { AuthField, PhoneField } from '@/pages/Auth/AuthLayout';
import AddressPickerField from '@/components/address/AddressPickerField';
import LocationPicker from '@/components/address/LocationPicker';
import { formatAddress } from '@/utils/address';
import type { AddressDraft, AuthUser } from '@/types';

export const ADDRESS_REQUIRED_MESSAGE = 'حدّد عنوانك على الخريطة علشان المندوب يوصلك';

interface Props {
  user: AuthUser;
  /** After saving. */
  onDone: (saved: AuthUser) => void;
  submitLabel?: string;
}

export default function CompleteProfileForm({ user, onDone, submitLabel = 'حفظ وكمّل' }: Props) {
  const completeProfile = useAuthStore((s) => s.completeProfile);
  const { addresses, load } = useAddressStore();

  const [values, setValues] = useState({
    name: user.name ?? '',
    phone: user.phone ?? '',
    village: user.village ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [villageCenter, setVillageCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Picked on the map here; until then the default in عناويني (if any) is offered
  const [picked, setPicked] = useState<AddressDraft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Set once and kept (a phone can't be changed here)
  const hasPhone = Boolean(user.phone?.trim());

  useEffect(() => {
    void load();
  }, [load, user.id]);

  const savedDefault = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const mapAddress: AddressDraft | null = picked ?? savedDefault;
  // A saved address offered as it is gets updated, not added a second time
  const fromSavedId = picked ? null : (savedDefault?.id ?? null);

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors(({ [field]: _old, ...rest }) => rest);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parsed = completeProfileSchema.safeParse({
      ...values,
      phone: hasPhone ? user.phone : values.phone,
      address: mapAddress ? formatAddress(mapAddress).slice(0, 120) : '',
    });
    if (!parsed.success || !mapAddress) {
      const fieldErrors = parsed.success ? {} : fieldErrorsFrom(parsed.error.issues);
      if (!mapAddress) fieldErrors.address = ADDRESS_REQUIRED_MESSAGE;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const saved = await completeProfile(parsed.data);
      // The spot on the map becomes the default address (عناويني)
      await useAddressStore
        .getState()
        .save(mapAddress, fromSavedId ?? undefined, true)
        .catch(() => undefined);
      onDone(saved);
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'حصلت مشكلة، حاول تاني');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" aria-label="كمّل بياناتك">
      {user.email && (
        <p className="text-xs text-text-muted text-center">
          داخل بحساب: <span dir="ltr" className="font-bold">{user.email}</span>
        </p>
      )}
      <AuthField id="cpName" label="الاسم بالكامل" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
      {!hasPhone && (
        <PhoneField id="cpPhone" label="رقم الموبايل" value={values.phone} onChange={set('phone')} error={errors.phone} />
      )}
      <VillagePicker

        id="cpVillage"

        value={values.village}

        onChange={(village, picked) => {

          setValues((v) => ({ ...v, village }));

          setVillageCenter(picked && picked.lat !== null && picked.lng !== null ? { lat: picked.lat, lng: picked.lng } : null);

          setErrors(({ village: _old, ...rest }) => rest);

        }}

        error={errors.village}

      />
      <AddressPickerField
        id="cpAddress"
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
          villageCenter={villageCenter}
        defaultPhone={normalizeEgyptianPhone(hasPhone ? user.phone : values.phone)}
        saveLabel="تمام، ده عنواني"
        onSave={(draft) => {
          setPicked(draft);
          setErrors(({ address: _old, ...rest }) => rest);
          setPickerOpen(false);
        }}
      />

      {formError && (
        <p className="input-error-msg text-center" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
