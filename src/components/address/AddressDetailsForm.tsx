// ─── Second step of the picker: "العنوان بالكامل"
import { lazy, Suspense, useState, type FormEvent } from 'react';
import type { AddressDraft, LatLng } from '@/types';
import { Input } from '@/components/ui/Input';
import { addressDraftSchema, normalizeEgyptianPhone } from '@/utils/validators';
import { ADDRESS_LABELS, labelEmoji } from '@/utils/address';
import type { MapLayer } from '@/services/maps/config';
import { BackIcon } from './LocationPicker';
import { PhoneInput } from '@/components/ui/PhoneInput';

const MapCanvas = lazy(() => import('@/services/maps/MapCanvas'));

interface Props {
  point: LatLng;
  layer: MapLayer;
  initial?: Partial<AddressDraft> | null;
  /** Street name from the map, used when the address has none yet. */
  suggestedStreet: string;
  defaultPhone: string;
  showDefaultToggle: boolean;
  defaultChecked: boolean;
  saveLabel?: string;
  onBack: () => void;
  onSave: (draft: AddressDraft, makeDefault: boolean) => Promise<void> | void;
}

type Field = 'label' | 'street' | 'building' | 'floor' | 'landmark' | 'phone';
const OTHER = 'تاني';

export default function AddressDetailsForm({
  point,
  layer,
  initial,
  suggestedStreet,
  defaultPhone,
  showDefaultToggle,
  defaultChecked,
  saveLabel = 'احفظ العنوان',
  onBack,
  onSave,
}: Props) {
  const startLabel = initial?.label?.trim() || ADDRESS_LABELS[0];
  const isPreset = (ADDRESS_LABELS as readonly string[]).includes(startLabel);
  const [chip, setChip] = useState<string>(isPreset ? startLabel : OTHER);
  const [customLabel, setCustomLabel] = useState(isPreset ? '' : startLabel);
  const [form, setForm] = useState({
    street: initial?.street ?? suggestedStreet,
    building: initial?.building ?? '',
    floor: initial?.floor ?? '',
    landmark: initial?.landmark ?? '',
    phone: initial?.phone || defaultPhone || '',
  });
  const [makeDefault, setMakeDefault] = useState(defaultChecked);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const draft: AddressDraft = {
      lat: point.lat,
      lng: point.lng,
      label: chip === OTHER ? customLabel : chip,
      street: form.street,
      building: form.building,
      floor: form.floor,
      landmark: form.landmark,
      phone: form.phone.trim() ? normalizeEgyptianPhone(form.phone) : '',
    };
    const parsed = addressDraftSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as Field;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await onSave(parsed.data as AddressDraft, makeDefault);
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : 'العنوان مااتحفظش، جرّب تاني');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex-1 min-h-0 flex flex-col bg-cream">
      <header className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white shadow-sm">
        <button type="button" onClick={onBack} className="w-11 h-11 grid place-items-center rounded-full text-green-dark" aria-label="رجوع للخريطة">
          <BackIcon />
        </button>
        <h1 className="flex-1 font-black text-green-dark text-lg">العنوان بالكامل</h1>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {/* Where the pin is, tap to move it */}
        <button
          type="button"
          onClick={onBack}
          className="relative block w-full h-32 rounded-2xl overflow-hidden border border-gold-light/60 mb-4 shadow-sm"
          aria-label="غيّر المكان على الخريطة"
        >
          <Suspense fallback={<div className="absolute inset-0 bg-[#e8eee9]" />}>
            <MapCanvas className="absolute inset-0 z-0 bg-[#e8eee9]" initialCenter={point} initialZoom={17} layer={layer} interactive={false} />
          </Suspense>
          <span className="absolute inset-0 z-[400] grid place-items-center pointer-events-none">
            <svg width="30" height="38" viewBox="0 0 44 54" className="-translate-y-[17px] drop-shadow">
              <path d="M22 53C22 53 42 33.6 42 21A20 20 0 1 0 2 21C2 33.6 22 53 22 53Z" fill="#1a7a4a" stroke="#fff" strokeWidth="3" />
              <circle cx="22" cy="21" r="7" fill="#fff" />
            </svg>
          </span>
          <span className="absolute bottom-2 left-2 z-[400] bg-white/95 text-green-dark text-xs font-bold rounded-full px-3 py-1.5 shadow">
            ← غيّر المكان
          </span>
        </button>

        <fieldset className="mb-4">
          <legend className="font-bold text-sm text-text mb-2">اسم العنوان</legend>
          <div className="flex flex-wrap gap-2">
            {[...ADDRESS_LABELS, OTHER].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setChip(l);
                  setErrors((er) => ({ ...er, label: undefined }));
                }}
                aria-pressed={chip === l}
                className={`min-h-[42px] px-4 rounded-full border-2 font-bold text-sm transition ${
                  chip === l ? 'bg-green border-green text-white' : 'bg-white border-gray-200 text-text'
                }`}
              >
                {l === OTHER ? '✏️ اسم تاني' : `${labelEmoji(l)} ${l}`}
              </button>
            ))}
          </div>
          {chip === OTHER && (
            <div className="mt-3">
              <Input
                aria-label="اسم العنوان"
                placeholder="مثلاً: بيت جدي"
                value={customLabel}
                maxLength={40}
                onChange={(e) => {
                  setCustomLabel(e.target.value);
                  setErrors((er) => ({ ...er, label: undefined }));
                }}
                error={errors.label}
              />
            </div>
          )}
        </fieldset>

        <Input label="الشارع" placeholder="مثلاً: شارع الجامع" value={form.street} onChange={set('street')} maxLength={150} error={errors.street} autoComplete="address-line1" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="رقم البيت أو اسمه" placeholder="مثلاً: 12 أو بيت الحاج علي" value={form.building} onChange={set('building')} maxLength={80} error={errors.building} />
          <Input label="الدور" placeholder="مثلاً: التاني" value={form.floor} onChange={set('floor')} maxLength={30} error={errors.floor} />
        </div>
        <Input label="علامة مميزة" placeholder="مثلاً: جنب المدرسة الابتدائي" value={form.landmark} onChange={set('landmark')} maxLength={150} error={errors.landmark} />
        <div className="form-group">
          <label htmlFor="addrPhone">رقم الموبايل</label>
          <PhoneInput
            id="addrPhone"
            className={`q-input ${errors.phone ? 'is-invalid' : ''}`}
            value={form.phone}
            onChange={set('phone')}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'addrPhoneError' : undefined}
          />
          {errors.phone && (
            <span id="addrPhoneError" className="input-error-msg" role="alert">
              {errors.phone}
            </span>
          )}
        </div>

        {showDefaultToggle && (
          <label className="flex items-center gap-3 mt-1 mb-2 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer">
            <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="w-5 h-5 accent-[#1a7a4a]" />
            <span className="font-bold text-sm">خلّيه العنوان الأساسي</span>
          </label>
        )}

        {saveError && (
          <p className="mt-2 text-danger text-sm font-bold" role="alert">
            {saveError}
          </p>
        )}
      </div>

      <div className="bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] rounded-2xl bg-green text-white font-black text-lg shadow-md active:scale-[0.98] transition disabled:opacity-60"
        >
          {saving ? 'جاري الحفظ…' : saveLabel}
        </button>
      </div>
    </form>
  );
}
