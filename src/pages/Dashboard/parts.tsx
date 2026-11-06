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

// ─── Emoji picker for the add-product form
// A read-only field that opens a small grid: no phone keyboard, no zoom,
// and the value can only ever be an emoji from the list. Arabic search on top.
const normalizeAr = (text: string): string =>
  text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u0652]/g, '')
    .toLowerCase()
    .trim();

interface EmojiItem {
  e: string;
  keys: string;
}

const EMOJI_CHOICES: { label: string; items: EmojiItem[] }[] = [
  {
    label: 'ألبان وجبن',
    items: [
      { e: '🧀', keys: 'جبنه جبنة قريش رومي cheese' },
      { e: '🥛', keys: 'لبن حليب milk' },
      { e: '🧈', keys: 'زبده زبدة سمن butter ghee' },
      { e: '🍦', keys: 'ايس كريم آيس ice cream' },
    ],
  },
  {
    label: 'خضار وفاكهة',
    items: [
      { e: '🍅', keys: 'طماطم tomato' }, { e: '🥒', keys: 'خيار cucumber' }, { e: '🥔', keys: 'بطاطس potato' },
      { e: '🧅', keys: 'بصل onion' }, { e: '🧄', keys: 'ثوم garlic' }, { e: '🥬', keys: 'خس ورق خضار lettuce' },
      { e: '🍆', keys: 'باذنجان eggplant' }, { e: '🌶️', keys: 'فلفل حار pepper chili' },
      { e: '🍎', keys: 'تفاح apple' }, { e: '🍌', keys: 'موز banana' }, { e: '🍊', keys: 'برتقال orange' },
      { e: '🍇', keys: 'عنب grapes' }, { e: '🍉', keys: 'بطيخ watermelon' }, { e: '🍓', keys: 'فراوله فراولة strawberry' },
      { e: '🥭', keys: 'مانجو مانجا mango' }, { e: '🍋', keys: 'ليمون lemon' },
    ],
  },
  {
    label: 'عيش وحلويات',
    items: [
      { e: '🍞', keys: 'عيش خبز توست bread toast' }, { e: '🥖', keys: 'فينو رول عيش baguette roll' },
      { e: '🥐', keys: 'كرواسون croissant' }, { e: '🍰', keys: 'جاتوه كيك تورته كعك cake' },
      { e: '🧁', keys: 'كب كيك cupcake muffin' }, { e: '🍪', keys: 'بسكويت cookies biscuit' }, { e: '🍩', keys: 'دونات donut' },
      { e: '🍯', keys: 'عسل honey' },
    ],
  },
  {
    label: 'لحوم وفراخ وسمك',
    items: [
      { e: '🥩', keys: 'لحمه لحم meat steak' }, { e: '🍗', keys: 'فراخ دجاج chicken' }, { e: '🐔', keys: 'فرخه فرخة chicken hen' },
      { e: '🐟', keys: 'سمك fish' }, { e: '🦐', keys: 'جمبري shrimp' }, { e: '🥚', keys: 'بيض eggs egg' },
    ],
  },
  {
    label: 'بقالة ومشروبات',
    items: [
      { e: '🍚', keys: 'رز ارز rice' }, { e: '🍝', keys: 'مكرونه مكرونة pasta' }, { e: '🥫', keys: 'معلبات تونه canned tuna' },
      { e: '🫘', keys: 'فول فاصوليا beans' }, { e: '🧂', keys: 'ملح salt' }, { e: '🍬', keys: 'سكر حلويات بونبون sugar candy' },
      { e: '🍫', keys: 'شوكولاته شوكولاتة chocolate' }, { e: '☕', keys: 'قهوه قهوة بن coffee' },
      { e: '🧃', keys: 'عصير juice' }, { e: '🥤', keys: 'مشروب صودا soda drink' },
    ],
  },
  {
    label: 'منظفات ومنزلية',
    items: [
      { e: '🧼', keys: 'صابون غسيل soap' }, { e: '🧴', keys: 'شامبو shampoo' }, { e: '🧽', keys: 'اسفنج اسفنجه sponge' },
      { e: '🧹', keys: 'مكنسه مكنسة نظافه broom cleaning' }, { e: '🪥', keys: 'فرشه فرشة معجون اسنان toothbrush' },
      { e: '🧻', keys: 'مناديل ورق tissues' }, { e: '🕯️', keys: 'شمعه شمعة candle' }, { e: '🔌', keys: 'فيشه فيشة كهربا plug' },
    ],
  },
  {
    label: 'أدوية',
    items: [
      { e: '💊', keys: 'دواء ادويه ادوية برشام medicine pills' }, { e: '🩹', keys: 'لصقه لصقة جروح bandage' },
      { e: '🌡️', keys: 'ترمومتر حراره حرارة thermometer' },
    ],
  },
  {
    label: 'متنوع',
    items: [
      { e: '📦', keys: 'كرتونه كرتونة صندوق box package' }, { e: '🛒', keys: 'تسوق عربيه cart shopping' },
      { e: '🎁', keys: 'هديه هدية gift' }, { e: '👶', keys: 'طفل بيبي baby' }, { e: '🍼', keys: 'رضاعه رضاعة ببرونه bottle' },
    ],
  },
];

export function EmojiPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const q = normalizeAr(query);
  const matches = q
    ? EMOJI_CHOICES.flatMap((cat) => cat.items).filter((item) => normalizeAr(item.keys).includes(q))
    : [];
  return (
    <div>
      <span className="block text-[12px] font-bold text-text-muted mb-1">{label}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[42px] px-3 rounded-xl border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[16px] font-bold text-text cursor-pointer focus:outline-none focus:border-green"
      >
        {value ? value : <span className="text-[13px] text-text-muted">اختار إيموجي...</span>}
      </button>
      {open && (
        <div className="mt-2 p-2 rounded-xl border border-[rgba(26,122,74,0.2)] bg-white">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="دوّر: جبنة، لبن، دواء..."
            aria-label="دوّر على إيموجي"
            className="w-full min-h-[40px] px-3 mb-2 rounded-lg border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[16px] font-bold text-text focus:outline-none focus:border-green"
          />
          <div className="max-h-[210px] overflow-y-auto">
            {q ? (
              matches.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {matches.map((item) => (
                    <button
                      key={item.e}
                      type="button"
                      aria-label={item.keys.split(' ')[0]}
                      onClick={() => {
                        onChange(item.e);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`w-10 h-10 rounded-lg text-[22px] flex items-center justify-center cursor-pointer border transition-colors ${
                        value === item.e ? 'border-green bg-cream' : 'border-transparent hover:bg-cream/60'
                      }`}
                    >
                      {item.e}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-text-muted m-0">مفيش إيموجي بالاسم ده.</p>
              )
            ) : (
              EMOJI_CHOICES.map((cat) => (
                <div key={cat.label} className="mb-1.5">
                  <p className="text-[11px] font-bold text-text-muted m-0 mb-0.5">{cat.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {cat.items.map((item) => (
                      <button
                        key={item.e}
                        type="button"
                        aria-label={item.keys.split(' ')[0]}
                        onClick={() => {
                          onChange(item.e);
                          setOpen(false);
                          setQuery('');
                        }}
                        className={`w-10 h-10 rounded-lg text-[22px] flex items-center justify-center cursor-pointer border transition-colors ${
                          value === item.e ? 'border-green bg-cream' : 'border-transparent hover:bg-cream/60'
                        }`}
                      >
                        {item.e}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
