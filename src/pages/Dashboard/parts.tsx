// ─── Small shared pieces for the provider dashboard pages
import { useRef, useState, type ReactNode } from 'react';
import { ACCEPTED_IMAGE_TYPES, fileToDataUrl } from '@/utils/imageFile';

/** A titled card, the dashboard's building block. */
export function Section({ icon, title, hint, children }: { icon: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] shadow-[0_2px_10px_rgba(26,122,74,0.05)] p-4 mb-4">
      <h2 className="text-[1.05rem] font-black text-green-dark m-0 mb-1">
        {icon} {title}
      </h2>
      {hint && <p className="text-[12px] text-text-muted mt-0 mb-3">{hint}</p>}
      {children}
    </section>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelOn: string;
  labelOff: string;
  /** Accessible name when the two labels describe states, not the action. */
  ariaLabel: string;
}

/** A tap-friendly on/off switch with its state written next to it. */
export function Toggle({ checked, onChange, labelOn, labelOff, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
    >
      <span
        className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-green' : 'bg-gray-300'}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'start-[22px]' : 'start-0.5'}`}
        />
      </span>
      <span className={`text-[13px] font-extrabold ${checked ? 'text-green' : 'text-text-muted'}`}>
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
}

/** A labeled text/number field row used by the dashboard forms. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
  dir?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-text-muted mb-1">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[42px] px-3 rounded-xl border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[14px] font-bold text-text focus:outline-none focus:border-green"
      />
    </label>
  );
}

/** Pick an image from the device; onPick gets a downscaled data URL. */
export function PhotoButton({
  onPick,
  onError,
  label = '📷 غيّر الصورة',
  ariaLabel,
}: {
  onPick: (dataUrl: string) => void;
  onError: (message: string) => void;
  label?: string;
  ariaLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setBusy(true);
          fileToDataUrl(file)
            .then(onPick)
            .catch((err: unknown) => onError(err instanceof Error ? err.message : 'ماقدرناش نقرأ الصورة'))
            .finally(() => setBusy(false));
        }}
      />
      <button
        type="button"
        disabled={busy}
        aria-label={ariaLabel}
        onClick={() => inputRef.current?.click()}
        className="min-h-[38px] px-2.5 rounded-lg border border-[rgba(26,122,74,0.25)] bg-white text-[12px] font-bold text-green-dark cursor-pointer hover:bg-cream/60 transition-colors disabled:opacity-60"
      >
        {busy ? 'بنجهّز الصورة...' : label}
      </button>
    </>
  );
}
