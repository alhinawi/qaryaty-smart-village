// ─── "القرية": search every village in Egypt, or type it by hand
// Type two letters → matching villages, each with its markaz and governorate (many villages
// share a name). Picking one saves its label ("منية سندوب، مركز المنصورة - الدقهلية"); the
// database links it to the village id. "قريتي مش موجودة" turns the box into plain text.
// Old free-text values show as they are and stay valid.
import { useEffect, useId, useRef, useState } from 'react';
import { villageRepo, type VillageOption } from '@/repositories';

export const NOT_SERVED_NOTE = 'لسه مش بنوصّل عندك، وهنبلّغك أول ما نوصل';
export const PICK_FROM_LIST = 'اختار قريتك من القايمة، أو دوس «قريتي مش موجودة»';
const SEARCH_DELAY_MS = 250;

interface VillagePickerProps {
  id: string;
  label?: string;
  /** The saved village text ('' while nothing is chosen). */
  value: string;
  /** `picked` is the village from the list, or null for a typed name / nothing yet. */
  onChange: (value: string, picked: VillageOption | null) => void;
  error?: string;
  hint?: string;
}

export function VillagePicker({ id, label = 'القرية', value, onChange, error, hint }: VillagePickerProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<VillageOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const [picked, setPicked] = useState<VillageOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `${id}-list`;
  const uid = useId();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  // The form can set the value from outside (a saved profile loading late)
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value && value !== query && !open) setQuery(value);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Search after a short pause in typing; only the latest answer counts
  const search = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    const mine = ++seq.current;
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      villageRepo
        .search(q, 20)
        .then((list) => {
          if (mine !== seq.current) return;
          setResults(list);
          setFailed(false);
          setActive(list.length ? 0 : -1);
        })
        .catch(() => {
          if (mine !== seq.current) return;
          setResults([]);
          setFailed(true);
        })
        .finally(() => mine === seq.current && setLoading(false));
    }, SEARCH_DELAY_MS);
  };

  const choose = (v: VillageOption) => {
    setPicked(v);
    setQuery(v.label);
    setOpen(false);
    onChange(v.label, v);
  };

  const goManual = () => {
    setMode('manual');
    setOpen(false);
    setPicked(null);
    // Keep what they typed, minus a label from the list they had picked before
    const typed = picked ? '' : query.trim();
    setQuery(typed);
    onChange(typed, null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const backToSearch = () => {
    setMode('search');
    setPicked(null);
    setOpen(query.trim().length >= 2);
    search(query);
    onChange('', null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Options: the villages, then "قريتي مش موجودة" (index results.length)
  const optionCount = results.length + 1;
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mode !== 'search') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % optionCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (active >= 0 && active < results.length) choose(results[active]);
      else if (active === results.length) goManual();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const typedWithoutPick = mode === 'search' && !value && query.trim().length > 0 && !open;
  const shownError = error ? (mode === 'search' && query.trim() && !value ? PICK_FROM_LIST : error) : typedWithoutPick ? PICK_FROM_LIST : '';
  const showNotServed = mode === 'search' && picked && !picked.served && value === picked.label;
  const describedBy =
    [shownError ? `${id}-error` : null, showNotServed ? `${id}-served` : null, hint && !shownError ? `${id}-hint` : null]
      .filter(Boolean)
      .join(' ') || undefined;
  const showList = mode === 'search' && open && query.trim().length >= 2;

  return (
    <div className="form-group relative">
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        autoComplete="off"
        enterKeyHint={mode === 'search' ? 'search' : 'done'}
        placeholder={mode === 'search' ? 'اكتب أول حروف من اسم قريتك' : 'اكتب اسم قريتك والمركز'}
        role={mode === 'search' ? 'combobox' : undefined}
        aria-expanded={mode === 'search' ? showList : undefined}
        aria-controls={mode === 'search' ? listId : undefined}
        aria-autocomplete={mode === 'search' ? 'list' : undefined}
        aria-activedescendant={showList && active >= 0 ? `${uid}-opt-${active}` : undefined}
        aria-invalid={shownError ? true : undefined}
        aria-describedby={describedBy}
        value={query}
        maxLength={80}
        onChange={(e) => {
          const text = e.target.value;
          setQuery(text);
          if (mode === 'manual') {
            onChange(text, null);
            return;
          }
          setPicked(null);
          setOpen(true);
          search(text);
          if (value) onChange('', null);
        }}
        onFocus={() => {
          if (mode === 'search' && !value && query.trim().length >= 2) {
            setOpen(true);
            if (!results.length && !loading) search(query);
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="القرى اللي بتبدأ باللي كتبته"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {loading && results.length === 0 && (
            <li className="px-3 py-2.5 text-[13px] text-text-muted" aria-live="polite">
              بندوّر...
            </li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2.5 text-[13px] text-text-muted" aria-live="polite">
              {failed ? 'ماقدرناش ندوّر دلوقتي، اكتب اسم قريتك بنفسك' : 'مالقيناش قرية بالاسم ده'}
            </li>
          )}
          {results.map((v, i) => (
            <li
              key={v.id}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 ${i === active ? 'bg-cream' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(v)}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-text">{v.name}</span>
                <span className="block truncate text-[12px] text-text-muted">
                  {v.markaz ? `${v.markaz} - ` : ''}
                  {v.governorate}
                </span>
              </span>
              {v.served && (
                <span className="shrink-0 rounded-full bg-green px-2 py-0.5 text-[11px] font-bold text-white">بنوصّل هنا</span>
              )}
            </li>
          ))}
          <li
            id={`${uid}-opt-${results.length}`}
            role="option"
            aria-selected={active === results.length}
            className={`cursor-pointer border-t border-gray-200 px-3 py-2.5 text-sm font-bold text-green ${active === results.length ? 'bg-cream' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(results.length)}
            onClick={goManual}
          >
            قريتي مش موجودة، هكتبها بنفسي
          </li>
        </ul>
      )}

      {mode === 'manual' ? (
        <span className="text-[11px] text-text-muted">
          هنحفظ اسم قريتك زي ما كتبته.{' '}
          <button type="button" className="font-bold text-green underline" onClick={backToSearch}>
            ارجع للبحث
          </button>
        </span>
      ) : (
        hint &&
        !shownError &&
        !showNotServed && (
          <span id={`${id}-hint`} className="text-[11px] text-text-muted">
            {hint}
          </span>
        )
      )}
      {showNotServed && (
        <span id={`${id}-served`} className="text-[12px] text-brown" role="status">
          {NOT_SERVED_NOTE}
        </span>
      )}
      {shownError && (
        <span id={`${id}-error`} className="input-error-msg" role="alert">
          {shownError}
        </span>
      )}
    </div>
  );
}
