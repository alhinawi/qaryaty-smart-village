// ─── A form field that opens the map instead of a text box
import type { AddressDraft } from '@/types';
import { formatAddress, labelEmoji } from '@/utils/address';

interface Props {
  id: string;
  label: string;
  value: AddressDraft | null;
  onOpen: () => void;
  error?: string;
  placeholder?: string;
}

export default function AddressPickerField({ id, label, value, onOpen, error, placeholder = 'حدّد بيتك على الخريطة' }: Props) {
  return (
    <div className="form-group">
      <span id={`${id}-label`} className="block font-bold text-sm mb-1.5">
        {label}
      </span>
      <button
        id={id}
        type="button"
        onClick={onOpen}
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={`w-full min-h-[52px] flex items-center gap-3 rounded-xl border-2 bg-white px-3 py-2.5 text-right transition active:scale-[0.99] ${
          error ? 'border-danger' : value ? 'border-green/40' : 'border-dashed border-green/50'
        }`}
      >
        <span className="shrink-0 w-9 h-9 rounded-full bg-green/10 text-green grid place-items-center text-lg" aria-hidden="true">
          {value ? labelEmoji(value.label) : '📍'}
        </span>
        <span className="flex-1 min-w-0">
          {value ? (
            <>
              <span className="block font-bold text-text text-sm">{value.label}</span>
              <span className="block text-xs text-text-muted truncate">{formatAddress(value)}</span>
            </>
          ) : (
            <span className="block font-bold text-green-dark">{placeholder}</span>
          )}
        </span>
        <span className="shrink-0 text-xs font-bold text-green bg-green/10 rounded-full px-2.5 py-1">{value ? 'غيّر' : 'افتح الخريطة'}</span>
      </button>
      {error && (
        <span id={`${id}-error`} className="input-error-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
