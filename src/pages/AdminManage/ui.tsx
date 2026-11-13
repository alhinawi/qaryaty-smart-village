// ─── Small pieces the dashboard tabs share
import { useState, type ReactNode } from 'react';
import { inputCls, labelCls, smallBtn, type useDefaultDeliveryFee } from './shared';
import { compressImage } from '@/utils/compressImage';
import { adminRepo } from '@/repositories';
import { parseDeliveryFee } from '@/repositories/admin/logic';
import type { PhotoFolder } from '@/repositories/admin/types';
import { useUIStore } from '@/stores/useUIStore';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-black/5 shadow-sm p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mt-5 mb-2">
      <h2 className="text-[1.05rem] font-black text-green-dark m-0">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-center text-text-muted text-sm py-8 m-0">{children}</p>;
}

export function Loading() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="بيحمّل">
      <span className="w-8 h-8 rounded-full border-4 border-green/20 border-t-green animate-spin" />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm p-3 flex items-center justify-between gap-2">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className={smallBtn} onClick={onRetry}>
          جرّب تاني
        </button>
      )}
    </div>
  );
}

/** Toggle switch with a label, for open/hidden/served/admin flags. */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 min-h-[40px] cursor-pointer select-none text-sm font-bold">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border-0 transition-colors cursor-pointer disabled:opacity-50 ${
          checked ? 'bg-green' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            checked ? 'right-0.5' : 'right-[22px]'
          }`}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}

/** Photo field: shows the current photo, uploads a new one (shrunk first) to the catalog bucket. */
export function PhotoField({
  value,
  onChange,
  folder,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: PhotoFolder;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await compressImage(file);
      onChange(await adminRepo.uploadPhoto(folder, blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ماقدرناش نرفع الصورة');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <span className={labelCls}>الصورة</span>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-cream border border-black/10 overflow-hidden flex items-center justify-center text-2xl shrink-0">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : '🖼️'}
        </div>
        <label className={`${smallBtn} ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
          {busy ? 'بيترفع…' : value ? 'غيّر الصورة' : 'اختار صورة'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {value && (
          <button type="button" className={smallBtn} onClick={() => onChange(null)}>
            شيلها
          </button>
        )}
      </div>
      {error && <p className="text-red-700 text-xs mt-1 mb-0">{error}</p>}
    </div>
  );
}

/** Fee input that saves on its own button; empty = none when `allowEmpty`. */
export function FeeInput({
  value,
  allowEmpty,
  placeholder,
  label,
  onSave,
}: {
  value: number | null;
  allowEmpty: boolean;
  placeholder?: string;
  label: string;
  onSave: (fee: number | null) => Promise<unknown>;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const showToast = useUIStore((s) => s.showToast);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(value == null ? '' : String(value));
  }
  const parsed = parseDeliveryFee(text, allowEmpty);
  const changed = parsed.ok ? parsed.value !== value : true;
  const save = async () => {
    if (!parsed.ok) return setError(parsed.error);
    setBusy(true);
    setError('');
    try {
      await onSave(parsed.value);
      showToast(parsed.value == null ? `${label}: اتشالت` : `${label}: ${parsed.value} جنيه`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حصلت مشكلة');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          className={`${inputCls} !min-h-[40px] w-24 text-center`}
          inputMode="decimal"
          aria-label={label}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            setError('');
          }}
        />
        <span className="text-[13px] text-text-muted">جنيه</span>
        <button type="button" className={smallBtn} disabled={busy || !changed} onClick={save}>
          {busy ? 'لحظة…' : 'حفظ'}
        </button>
      </div>
      {error && <p className="text-red-700 text-xs mt-1 mb-0">{error}</p>}
    </div>
  );
}

/** The default delivery fee (app_settings), editable. */
export function DefaultDeliveryFeeCard({ state }: { state: ReturnType<typeof useDefaultDeliveryFee> }) {
  const { data, setData, error, reload } = state;
  return (
    <Card className="mt-3 !p-3">
      <p className="m-0 font-extrabold text-[14px]">🛵 رسوم التوصيل الأساسية</p>
      <p className="m-0 mb-2 text-[12px] text-text-muted">
        على كل طلب من محل جوه القرية. المحل اللي ليه رسوم خاصة بياخد رسومه، والقرية البعيدة لو رسومها أعلى بتاخد رسومها.
      </p>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data != null && (
        <FeeInput
          value={data}
          allowEmpty={false}
          label="رسوم التوصيل الأساسية"
          onSave={async (fee) => {
            await adminRepo.setDefaultDeliveryFee(fee as number);
            setData(fee as number);
          }}
        />
      )}
    </Card>
  );
}
