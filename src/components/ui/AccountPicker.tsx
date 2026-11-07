// ─── Imports
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';
import { filterAccounts } from '@/utils/accountFilter';
import type { AuthUser } from '@/types';

// ─── Types
interface AccountPickerProps {
  users: AuthUser[];
  /** Selected user id, '' means no link. */
  value: string;
  onChange: (id: string) => void;
  label: string;
  noneLabel?: string;
}

// ─── Component
// Searchable account combobox. A native <select> becomes unusable once the
// platform has hundreds of accounts, so this opens a sheet with a search box
// (Arabic/English, name/email/phone/username) and big tap targets.
export function AccountPicker({
  users,
  value,
  onChange,
  label,
  noneLabel = 'من غير ربط بحساب',
}: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = users.find((u) => u.id === value) ?? null;
  const filtered = useMemo(() => filterAccounts(users, query), [users, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    // Focus after the sheet settles so the mobile keyboard opens with it.
    // 16px font on the input keeps iOS/Android from zooming on focus.
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="block">
      <span className="block text-[12px] font-bold text-text-muted mb-1">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="w-full min-h-[44px] px-3 rounded-xl border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[14px] font-bold text-text focus:outline-none focus:border-green flex items-center justify-between gap-2"
      >
        <span className="min-w-0 truncate">
          {selected ? `${selected.name} — ${selected.email || selected.phone}` : noneLabel}
        </span>
        <ChevronDown size={18} className="shrink-0 text-text-muted" aria-hidden />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="اربط بحساب" emoji="🔗">
        <div className="relative mb-3">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="دوّر بالاسم أو الإيميل أو الموبايل..."
            aria-label="دوّر على حساب"
            className="w-full min-h-[44px] ps-3 pe-10 rounded-xl border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[16px] font-bold text-text focus:outline-none focus:border-green"
          />
          <Search
            size={18}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden
          />
        </div>
        <ul className="m-0 p-0 list-none grid grid-cols-1 gap-1.5 max-h-[50vh] overflow-y-auto overscroll-contain">
          <li>
            <button type="button" onClick={() => pick('')} className={rowCls(value === '')}>
              <span className="flex-1 min-w-0 text-start text-[13px] font-bold text-text-muted truncate">
                {noneLabel}
              </span>
              {value === '' && <Check size={18} className="shrink-0 text-green" aria-hidden />}
            </button>
          </li>
          {filtered.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => pick(u.id)} className={rowCls(u.id === value)}>
                <span className="flex-1 min-w-0 text-start">
                  <span className="block text-[13px] font-extrabold text-text truncate">{u.name}</span>
                  <span className="block text-[11px] text-text-muted truncate" dir="ltr">
                    {u.email || u.phone}
                  </span>
                </span>
                {u.id === value && <Check size={18} className="shrink-0 text-green" aria-hidden />}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="text-[13px] text-text-muted text-center py-3">مفيش حساب بالبيانات دي.</li>
          )}
        </ul>
        <p className="text-[11px] text-text-muted mt-3 mb-0">
          {query.trim() ? `${filtered.length} نتيجة` : `${users.length} حساب`}
        </p>
      </Modal>
    </div>
  );
}

function rowCls(active: boolean): string {
  return `w-full min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
    active ? 'border-green bg-cream/60' : 'border-[rgba(26,122,74,0.12)] bg-white hover:bg-cream/40'
  }`;
}
