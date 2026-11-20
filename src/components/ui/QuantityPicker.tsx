// ─── Imports
import { useId, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  MAX_LINE_QUANTITY,
  clampQuantity,
  formatQuantity,
  formatQuantityNumber,
  parseQuantity,
  quickQuantities,
} from '@/utils/quantity';

interface QuantityProps {
  /** The item's name, for the buttons' spoken labels. */
  name: string;
  quantity: number;
  unit?: string;
  /** ½ for kilos sold by the half; 1 otherwise. */
  step?: number;
  /** The most that may be picked (stock in the demo); MAX_LINE_QUANTITY otherwise. */
  max?: number;
  /** The new quantity; 0 removes the line (minus at the smallest amount). */
  onChange: (quantity: number) => void;
}

const STEP_BTN =
  'w-11 h-11 shrink-0 rounded-lg bg-white border border-gray-300 text-lg font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center';

function limitOf(max: number | undefined, step: number) {
  return Math.min(clampQuantity(MAX_LINE_QUANTITY, step), max ?? Infinity);
}

/** Quick choices that suit the unit, and a box to type an exact number. */
export function QuantityChoices({
  name,
  quantity,
  unit,
  step = 1,
  max,
  onPick,
  autoFocusInput = false,
}: Omit<QuantityProps, 'onChange'> & { onPick: (quantity: number) => void; autoFocusInput?: boolean }) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const limit = limitOf(max, step);
  const choices = quickQuantities(unit, step).filter((q) => q <= limit);

  const submit = () => {
    const n = parseQuantity(typed);
    if (n === null) {
      setError('اكتب رقم صح');
      inputRef.current?.focus();
      return;
    }
    if (n > limit) {
      setError(`أكتر حاجة ${formatQuantity(limit, unit)} في المرة`);
      inputRef.current?.focus();
      return;
    }
    onPick(clampQuantity(n, step));
  };

  return (
    <div role="group" aria-label={`اختار عدد ${name}`} dir="rtl">
      {choices.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {choices.map((q) => {
            const selected = Math.abs(q - quantity) < 1e-9;
            return (
              <button
                key={q}
                type="button"
                aria-pressed={selected}
                aria-label={formatQuantity(q, unit)}
                className={`min-h-[44px] min-w-[44px] px-3 rounded-full text-[14px] font-bold cursor-pointer border ${
                  selected ? 'bg-green text-white border-green' : 'bg-gray-50 text-text border-gray-300'
                }`}
                onClick={() => onPick(q)}
              >
                {formatQuantityNumber(q)}
              </button>
            );
          })}
        </div>
      )}
      <form
        className="mt-2 flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor={`${id}-n`}>
          اكتب عدد {name}
          {unit ? ` بالـ${unit}` : ''}
        </label>
        <input
          ref={inputRef}
          id={`${id}-n`}
          type="text"
          inputMode={step < 1 ? 'decimal' : 'numeric'}
          enterKeyHint="done"
          autoComplete="off"
          autoFocus={autoFocusInput}
          placeholder={unit ? `أو اكتب العدد (${unit})` : 'أو اكتب العدد'}
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setError('');
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="flex-1 min-w-0 min-h-[44px] px-3 rounded-lg border border-gray-300 bg-white text-[16px] text-right"
        />
        <button
          type="submit"
          className="min-h-[44px] px-4 rounded-lg bg-green text-white text-[13px] font-bold cursor-pointer whitespace-nowrap"
        >
          تمام
        </button>
      </form>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-[12px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** − [١٠ رغيف ▾] +: plus and minus for fine tuning; the number opens the quick choices. */
function Stepper({ name, quantity, unit, step = 1, max, onChange, open, onToggle, controls }: QuantityProps & { open: boolean; onToggle?: () => void; controls?: string }) {
  const atMax = quantity + step > limitOf(max, step) + 1e-9;
  return (
    <div className="flex items-center justify-end gap-1.5" dir="ltr">
      <button
        type="button"
        className={STEP_BTN}
        onClick={() => onChange(quantity - step)}
        aria-label={quantity - step < step ? `شيل ${name}` : `أقل ${name}`}
      >
        −
      </button>
      {onToggle ? (
        <button
          type="button"
          className="min-w-[84px] min-h-[44px] px-2 rounded-lg bg-white border border-green/40 text-[13px] font-extrabold text-green-dark cursor-pointer"
          dir="rtl"
          aria-expanded={open}
          aria-controls={controls}
          aria-label={`العدد ${formatQuantity(quantity, unit)} — غيّر عدد ${name}`}
          onClick={onToggle}
        >
          <span aria-live="polite">{formatQuantity(quantity, unit)}</span>
          <span className="ms-1 text-[10px]" aria-hidden="true">
            {open ? '▲' : '▼'}
          </span>
        </button>
      ) : (
        <span className="min-w-[84px] text-center text-[15px] font-extrabold text-green-dark" dir="rtl" aria-live="polite">
          {formatQuantity(quantity, unit)}
        </span>
      )}
      <button type="button" className={STEP_BTN} disabled={atMax} onClick={() => onChange(quantity + step)} aria-label={`أكتر ${name}`}>
        +
      </button>
    </div>
  );
}

/** Inline: the stepper, and the quick choices open under it (the cart, a product row). */
export function QuantityPicker(props: QuantityProps & { defaultOpen?: boolean }) {
  const { defaultOpen = false, onChange, ...rest } = props;
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className="flex flex-col items-stretch gap-2 w-full">
      <Stepper {...rest} onChange={onChange} open={open} onToggle={() => setOpen((o) => !o)} controls={panelId} />
      {open && (
        <div id={panelId} className="rounded-xl bg-white border border-gray-200 p-2">
          <QuantityChoices
            {...rest}
            onPick={(q) => {
              onChange(q);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

/** A bottom sheet with the stepper and the quick choices (the photo cards in a shop's page). */
export function QuantitySheet({ isOpen, onClose, emoji, ...props }: QuantityProps & { isOpen: boolean; onClose: () => void; emoji?: string }) {
  const { name, quantity, unit, onChange } = props;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={unit ? `كام ${unit} ${name}؟` : `كام ${name}؟`} emoji={emoji} maxWidth="440px">
      <div dir="rtl" className="flex flex-col gap-3 pb-2" data-testid="quantity-sheet">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-gray-600">في السلة</span>
          <Stepper {...props} open />
        </div>
        <QuantityChoices
          {...props}
          onPick={(q) => {
            onChange(q);
            onClose();
          }}
        />
        {quantity > 0 && (
          <button type="button" onClick={onClose} className="min-h-[44px] rounded-xl bg-green-dark text-white font-bold cursor-pointer">
            تمام، {formatQuantity(quantity, unit)}
          </button>
        )}
      </div>
    </Modal>
  );
}
