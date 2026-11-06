// ─── At checkout: pick a saved address (like Talabat) or add one on the map
// Typing the address stays possible for anyone who can't use the map.
import { useEffect, useRef, useState } from 'react';
import type { LatLng, UserAddress } from '@/types';
import { useAddressStore } from '@/stores/useAddressStore';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { useReach } from '@/hooks/useReach';
import { addressForOrder, formatAddress, labelEmoji } from '@/utils/address';
import LocationPicker from './LocationPicker';

export interface ChosenAddress {
  /** The text saved on the order. */
  address: string;
  /** Where on the map; null when typed by hand. */
  point: LatLng | null;
  /** The saved address it came from. */
  addressId: string | null;
}

interface Props {
  id: string;
  label: string;
  value: ChosenAddress;
  onChange: (next: ChosenAddress) => void;
  /** Called with the address's own phone when it has one. */
  onPhone?: (phone: string) => void;
  error?: string;
}

function fromSaved(a: UserAddress): ChosenAddress {
  return { address: addressForOrder(a), point: { lat: a.lat, lng: a.lng }, addressId: a.id };
}

export default function AddressChooser({ id, label, value, onChange, onPhone, error }: Props) {
  const { addresses, loading, load, save } = useAddressStore();
  const user = useAuthStore(selectUser);
  const { village } = useReach();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [typing, setTyping] = useState(() => Boolean(value.address && !value.addressId));
  const autoPicked = useRef(false);
  const userTyped = useRef(false);

  useEffect(() => {
    void load();
  }, [load, user?.id]);

  // Start with the default address, like Talabat
  useEffect(() => {
    if (autoPicked.current || value.addressId || addresses.length === 0) return;
    autoPicked.current = true;
    if (userTyped.current) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    setTyping(false);
    onChange(fromSaved(def));
    if (def.phone) onPhone?.(def.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  const choose = (a: UserAddress) => {
    setTyping(false);
    onChange(fromSaved(a));
    if (a.phone) onPhone?.(a.phone);
  };

  return (
    <div className="form-group" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="block font-bold text-sm mb-1.5">
        {label}
      </span>

      {loading && addresses.length === 0 && <div className="h-14 rounded-xl bg-gray-100 animate-pulse" aria-busy="true" />}

      {addresses.length > 0 && (
        <ul className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
          {addresses.map((a) => {
            const selected = !typing && value.addressId === a.id;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(a)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-right transition ${
                    selected ? 'border-green bg-green/5' : 'border-gray-100 bg-white'
                  }`}
                >
                  <span className="shrink-0 text-xl" aria-hidden="true">
                    {labelEmoji(a.label)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-sm">{a.label}</span>
                    <span className="block text-xs text-text-muted truncate">{formatAddress(a)}</span>
                  </span>
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center ${selected ? 'border-green' : 'border-gray-300'}`}
                    aria-hidden="true"
                  >
                    {selected && <span className="w-2.5 h-2.5 rounded-full bg-green" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className={`flex flex-wrap gap-2 ${addresses.length ? 'mt-2' : ''}`}>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`flex-1 min-h-[46px] rounded-xl font-bold text-sm px-3 ${
            addresses.length ? 'bg-cream text-green-dark' : 'bg-green text-white shadow-sm'
          }`}
        >
          📍 {addresses.length ? 'عنوان جديد على الخريطة' : 'حدّد عنوانك على الخريطة'}
        </button>
        {!typing && (
          <button
            type="button"
            onClick={() => {
              userTyped.current = true;
              setTyping(true);
              onChange({ address: '', point: null, addressId: null });
            }}
            className="min-h-[46px] rounded-xl text-sm text-text-muted px-3 underline underline-offset-4"
          >
            أكتبه بإيدي
          </button>
        )}
      </div>

      {typing && (
        <input
          id={id}
          type="text"
          className={`mt-2 ${error ? 'is-invalid' : ''}`}
          placeholder="مثال: شارع الجامع الكبير، أمام المدرسة"
          value={value.address}
          onChange={(e) => onChange({ address: e.target.value, point: null, addressId: null })}
          aria-label="اكتب العنوان"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="street-address"
          autoFocus
        />
      )}

      {error && (
        <span id={`${id}-error`} className="input-error-msg" role="alert">
          {addresses.length === 0 && !typing ? 'حدّد عنوانك على الخريطة أو اكتبه بإيدك' : error}
        </span>
      )}

      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        village={village}
        defaultPhone={user?.phone ?? ''}
        showDefaultToggle={addresses.length > 0}
        defaultChecked={false}
        saveLabel="احفظ ووصّل هنا"
        onSave={async (draft, makeDefault) => {
          const saved = await save(draft, undefined, makeDefault);
          choose(saved);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
