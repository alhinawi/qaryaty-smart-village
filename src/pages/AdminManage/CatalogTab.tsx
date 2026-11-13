// ─── المحلات والخدمات: shops and their products, services, providers
// Add, edit, hide, prices and photos. Writes are allowed by RLS for admins only.
import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { adminRepo } from '@/repositories';
import {
  formatEGP,
  newProductId,
  parseDeliveryFee,
  priceText,
  productProblem,
  PROVIDER_KIND_LABEL,
  scopeForShop,
  SERVICE_CAT_LABEL,
  SHOP_KIND_LABEL,
} from '@/repositories/admin/logic';
import type { AdminProduct, AdminProvider, AdminService, AdminShop } from '@/repositories/admin/types';
import { normalizeArabic } from '@/repositories/villages/types';
import { Empty, ErrorBox, Loading, PhotoField, DefaultDeliveryFeeCard, Toggle } from './ui';
import { inputCls, labelCls, primaryBtn, smallBtn, useAction, useLoad, useDefaultDeliveryFee } from './shared';

type Sub = 'shops' | 'services' | 'providers';
type PriceType = 'fixed' | 'from' | 'quote';

const matches = (text: string, q: string) => !q.trim() || normalizeArabic(text).includes(normalizeArabic(q.trim()));

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function Row({
  photo,
  emoji,
  title,
  sub,
  dim,
  onClick,
  right,
}: {
  photo?: string | null;
  emoji: string;
  title: string;
  sub: string;
  dim?: boolean;
  onClick: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-2xl border border-black/5 shadow-sm p-2.5 ${dim ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-0 p-0 text-start cursor-pointer font-['Cairo',sans-serif]"
      >
        <span className="w-12 h-12 rounded-xl bg-cream overflow-hidden flex items-center justify-center text-2xl shrink-0">
          {photo ? <img src={photo} alt="" loading="lazy" className="w-full h-full object-cover" /> : emoji}
        </span>
        <span className="min-w-0">
          <span className="block font-extrabold text-[14px] truncate">{title}</span>
          <span className="block text-[12px] text-text-muted truncate">{sub}</span>
        </span>
      </button>
      {right}
    </div>
  );
}

function PriceFields({
  priceType,
  amount,
  onChange,
}: {
  priceType: PriceType;
  amount: number | null;
  onChange: (t: PriceType, a: number | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="نوع السعر">
        <select className={inputCls} value={priceType} onChange={(e) => onChange(e.target.value as PriceType, amount)}>
          <option value="fixed">ثابت</option>
          <option value="from">يبدأ من</option>
          <option value="quote">بالاتفاق</option>
        </select>
      </Field>
      <Field label="السعر (جنيه)">
        <input
          className={inputCls}
          type="number"
          inputMode="decimal"
          min={0}
          disabled={priceType === 'quote'}
          value={priceType === 'quote' || amount == null ? '' : amount}
          onChange={(e) => onChange(priceType, e.target.value === '' ? null : Number(e.target.value))}
        />
      </Field>
    </div>
  );
}

// ─── Shops + products ──────────────────────────────────────────────────────────────────

const emptyShop = (): Omit<AdminShop, 'id'> & { id?: number } => ({
  emoji: '🏪',
  name: '',
  description: '',
  open: true,
  time: '',
  kind: 'grocery',
  photo: null,
  hidden: false,
  deliveryFee: null,
});

function ShopForm({
  initial,
  defaultFee,
  onClose,
  onSaved,
}: {
  initial: Omit<AdminShop, 'id'> & { id?: number };
  defaultFee: number | null;
  onClose: () => void;
  onSaved: (s: AdminShop) => void;
}) {
  const [s, setS] = useState(initial);
  const [feeText, setFeeText] = useState(initial.deliveryFee == null ? '' : String(initial.deliveryFee));
  const fee = parseDeliveryFee(feeText, true);
  const { busy, run } = useAction();
  const save = async () => {
    if (s.name.trim().length < 2 || !fee.ok) return;
    const toSave = { ...s, deliveryFee: fee.value };
    let saved: AdminShop | null = null;
    const ok = await run('save', async () => (saved = await adminRepo.saveShop(toSave)), 'اتحفظ المحل');
    if (ok && saved) onSaved(saved);
  };
  return (
    <Modal isOpen onClose={onClose} title={s.id ? 'تعديل محل' : 'محل جديد'} emoji={s.emoji}>
      <div className="grid gap-3" dir="rtl">
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Field label="إيموجي">
            <input
              className={`${inputCls} text-center`}
              maxLength={4}
              value={s.emoji}
              onChange={(e) => setS({ ...s, emoji: e.target.value })}
            />
          </Field>
          <Field label="اسم المحل">
            <input
              className={inputCls}
              value={s.name}
              maxLength={60}
              onChange={(e) => setS({ ...s, name: e.target.value })}
            />
          </Field>
        </div>
        <Field label="النوع">
          <select
            className={inputCls}
            value={s.kind}
            disabled={!!s.id}
            onChange={(e) => setS({ ...s, kind: e.target.value })}
          >
            {Object.entries(SHOP_KIND_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="وصف قصير">
          <input
            className={inputCls}
            value={s.description}
            maxLength={120}
            onChange={(e) => setS({ ...s, description: e.target.value })}
          />
        </Field>
        <Field label="المواعيد أو وقت التوصيل">
          <input
            className={inputCls}
            value={s.time}
            maxLength={40}
            placeholder="مثلاً: 20-30 دقيقة"
            onChange={(e) => setS({ ...s, time: e.target.value })}
          />
        </Field>
        <Field label="رسوم التوصيل الخاصة بالمحل (سيبها فاضية للأساسية)">
          <input
            className={inputCls}
            inputMode="decimal"
            value={feeText}
            placeholder={defaultFee == null ? 'الأساسية' : `الأساسية: ${defaultFee} جنيه`}
            onChange={(e) => setFeeText(e.target.value)}
          />
        </Field>
        {!fee.ok && <p className="m-0 -mt-2 text-[12px] text-red-700">{fee.error}</p>}
        <PhotoField folder="shops" value={s.photo} onChange={(photo) => setS({ ...s, photo })} />
        <div className="flex flex-wrap gap-x-5">
          <Toggle label="فاتح دلوقتي" checked={s.open} onChange={(open) => setS({ ...s, open })} />
          <Toggle label="مخفي عن الناس" checked={s.hidden} onChange={(hidden) => setS({ ...s, hidden })} />
        </div>
        <button
          type="button"
          className={primaryBtn}
          disabled={!!busy || s.name.trim().length < 2 || !fee.ok}
          onClick={save}
        >
          {busy ? 'بيتحفظ…' : 'حفظ'}
        </button>
      </div>
    </Modal>
  );
}

function ProductForm({
  initial,
  isNew,
  onClose,
  onSaved,
}: {
  initial: AdminProduct;
  isNew: boolean;
  onClose: () => void;
  onSaved: (p: AdminProduct) => void;
}) {
  const [p, setP] = useState(initial);
  const { busy, run } = useAction();
  const problem = productProblem(p);
  const save = async () => {
    if (problem) return;
    const ok = await run('save', () => adminRepo.saveProduct(p, isNew), 'اتحفظ الصنف');
    if (ok) onSaved(p);
  };
  return (
    <Modal isOpen onClose={onClose} title={isNew ? 'صنف جديد' : 'تعديل صنف'} emoji={p.emoji || '📦'}>
      <div className="grid gap-3" dir="rtl">
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Field label="إيموجي">
            <input
              className={`${inputCls} text-center`}
              maxLength={4}
              value={p.emoji}
              onChange={(e) => setP({ ...p, emoji: e.target.value })}
            />
          </Field>
          <Field label="اسم الصنف">
            <input
              className={inputCls}
              value={p.name}
              maxLength={60}
              onChange={(e) => setP({ ...p, name: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="السعر (جنيه)">
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              min={0}
              value={Number.isFinite(p.price) ? p.price : ''}
              onChange={(e) =>
                setP({
                  ...p,
                  price: e.target.value === '' ? NaN : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="الوحدة">
            <input
              className={inputCls}
              value={p.unit}
              maxLength={20}
              placeholder="كيلو"
              onChange={(e) => setP({ ...p, unit: e.target.value })}
            />
          </Field>
        </div>
        <Field label="القسم (اختياري)">
          <input
            className={inputCls}
            value={p.section}
            maxLength={40}
            onChange={(e) => setP({ ...p, section: e.target.value })}
          />
        </Field>
        <PhotoField folder="products" value={p.photo} onChange={(photo) => setP({ ...p, photo })} />
        <Toggle label="مخفي (محدش يقدر يطلبه)" checked={p.hidden} onChange={(hidden) => setP({ ...p, hidden })} />
        {problem && <p className="m-0 text-[13px] text-red-700">{problem}</p>}
        <button type="button" className={primaryBtn} disabled={!!busy || !!problem} onClick={save}>
          {busy ? 'بيتحفظ…' : 'حفظ'}
        </button>
      </div>
    </Modal>
  );
}

function ShopProducts({ shop, onBack }: { shop: AdminShop; onBack: () => void }) {
  const scope = scopeForShop(shop);
  const { data, setData, error, reload } = useLoad(() => adminRepo.listProducts(scope), [scope]);
  const { busy, run } = useAction();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<{ p: AdminProduct; isNew: boolean } | null>(null);
  const list = (data ?? []).filter((p) => matches(`${p.name} ${p.section}`, q));
  const shared = shop.kind !== 'restaurant';

  const toggleHidden = (p: AdminProduct) =>
    run(`h-${p.productId}`, async () => {
      await adminRepo.saveProduct({ ...p, hidden: !p.hidden }, false);
      setData((all) => (all ?? []).map((x) => (x.productId === p.productId ? { ...x, hidden: !p.hidden } : x)));
    });

  return (
    <div>
      <button type="button" className={`${smallBtn} mt-3`} onClick={onBack}>
        → كل المحلات
      </button>
      <h2 className="text-[1.1rem] font-black text-green-dark mt-3 mb-1">
        {shop.emoji} أصناف {shop.name}
      </h2>
      {shared && (
        <p className="text-[12px] text-text-muted m-0 mb-2">
          اللستة دي مشتركة بين كل محلات نوع «{SHOP_KIND_LABEL[shop.kind] ?? shop.kind}»، أي تغيير هيظهر فيهم كلهم.
        </p>
      )}
      <div className="flex gap-2 mb-2">
        <input
          className={inputCls}
          type="search"
          value={q}
          placeholder="🔍 دوّر في الأصناف"
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className={`${smallBtn} whitespace-nowrap`}
          onClick={() =>
            setEdit({
              isNew: true,
              p: {
                scope,
                productId: newProductId((data ?? []).map((x) => x.productId)),
                name: '',
                price: NaN,
                unit: '',
                emoji: '',
                section: '',
                photo: null,
                hidden: false,
              },
            })
          }
        >
          + صنف
        </button>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && list.length === 0 && <Empty>مفيش أصناف هنا لسه</Empty>}
      <div className="grid gap-2">
        {list.map((p) => (
          <Row
            key={p.productId}
            photo={p.photo}
            emoji={p.emoji || '📦'}
            title={p.name}
            sub={`${formatEGP(p.price)} / ${p.unit}${p.section ? ` · ${p.section}` : ''}${p.hidden ? ' · مخفي' : ''}`}
            dim={p.hidden}
            onClick={() => setEdit({ p, isNew: false })}
            right={
              <button type="button" className={smallBtn} disabled={!!busy} onClick={() => toggleHidden(p)}>
                {p.hidden ? 'أظهر' : 'اخفي'}
              </button>
            }
          />
        ))}
      </div>
      {edit && (
        <ProductForm
          initial={edit.p}
          isNew={edit.isNew}
          onClose={() => setEdit(null)}
          onSaved={(saved) => {
            setEdit(null);
            setData((all) =>
              edit.isNew
                ? [...(all ?? []), saved]
                : (all ?? []).map((x) => (x.productId === saved.productId ? saved : x)),
            );
          }}
        />
      )}
    </div>
  );
}

function ShopsSection() {
  const { data, setData, error, reload } = useLoad(() => adminRepo.listShops(), []);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<(Omit<AdminShop, 'id'> & { id?: number }) | null>(null);
  const [products, setProducts] = useState<AdminShop | null>(null);
  const feeState = useDefaultDeliveryFee();
  const defaultFee = feeState.data;
  const list = (data ?? []).filter((s) => matches(`${s.name} ${SHOP_KIND_LABEL[s.kind] ?? ''}`, q));

  if (products) return <ShopProducts shop={products} onBack={() => setProducts(null)} />;

  return (
    <div>
      <DefaultDeliveryFeeCard state={feeState} />
      <div className="flex gap-2 mt-3 mb-2">
        <input
          className={inputCls}
          type="search"
          value={q}
          placeholder="🔍 دوّر على محل"
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className={`${smallBtn} whitespace-nowrap`} onClick={() => setEdit(emptyShop())}>
          + محل
        </button>
      </div>
      <p className="text-[12px] text-text-muted m-0 mb-2">
        دوس على المحل علشان تعدّله، وعلى «الأصناف» علشان تغيّر الأسعار.
      </p>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      <div className="grid gap-2">
        {list.map((s) => (
          <Row
            key={s.id}
            photo={s.photo}
            emoji={s.emoji}
            title={s.name}
            sub={`${SHOP_KIND_LABEL[s.kind] ?? s.kind} · ${s.hidden ? 'مخفي' : s.open ? 'فاتح' : 'مقفول'} · 🛵 ${
              s.deliveryFee != null
                ? `${s.deliveryFee} جنيه`
                : defaultFee != null
                  ? `${defaultFee} (الأساسية)`
                  : 'الأساسية'
            }`}
            dim={s.hidden}
            onClick={() => setEdit(s)}
            right={
              s.kind !== 'other' && (
                <button type="button" className={smallBtn} onClick={() => setProducts(s)}>
                  الأصناف
                </button>
              )
            }
          />
        ))}
      </div>
      {edit && (
        <ShopForm
          initial={edit}
          defaultFee={defaultFee}
          onClose={() => setEdit(null)}
          onSaved={(saved) => {
            setEdit(null);
            setData((all) => {
              const rest = (all ?? []).filter((x) => x.id !== saved.id);
              return [...rest, saved].sort((a, b) => a.id - b.id);
            });
          }}
        />
      )}
    </div>
  );
}

// ─── Services ───────────────────────────────────────────────────────────────────────────

type ServiceDraft = Omit<AdminService, 'id'> & { id?: number };

function ServiceForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: ServiceDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [s, setS] = useState(initial);
  const { busy, run } = useAction();
  const valid =
    s.name.trim().length >= 2 && (s.priceType === 'quote' || (s.numericPrice != null && s.numericPrice >= 0));
  const save = async () => {
    const ok = await run(
      'save',
      () =>
        adminRepo.saveService({
          ...s,
          price: priceText(s.priceType, s.numericPrice),
        }),
      'اتحفظت الخدمة',
    );
    if (ok) onSaved();
  };
  return (
    <Modal isOpen onClose={onClose} title={s.id ? 'تعديل خدمة' : 'خدمة جديدة'} emoji={s.emoji}>
      <div className="grid gap-3" dir="rtl">
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Field label="إيموجي">
            <input
              className={`${inputCls} text-center`}
              maxLength={4}
              value={s.emoji}
              onChange={(e) => setS({ ...s, emoji: e.target.value })}
            />
          </Field>
          <Field label="اسم الخدمة">
            <input
              className={inputCls}
              value={s.name}
              maxLength={60}
              onChange={(e) => setS({ ...s, name: e.target.value })}
            />
          </Field>
        </div>
        <Field label="القسم">
          <select className={inputCls} value={s.cat} onChange={(e) => setS({ ...s, cat: e.target.value })}>
            {Object.entries(SERVICE_CAT_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الوصف">
          <textarea
            className={`${inputCls} py-2 min-h-[80px]`}
            value={s.description}
            maxLength={300}
            onChange={(e) => setS({ ...s, description: e.target.value })}
          />
        </Field>
        <PriceFields
          priceType={s.priceType}
          amount={s.numericPrice}
          onChange={(priceType, numericPrice) => setS({ ...s, priceType, numericPrice })}
        />
        <p className="m-0 text-[12px] text-text-muted">الناس هتشوف: {priceText(s.priceType, s.numericPrice)}</p>
        <Toggle label="مخفية عن الناس" checked={s.hidden} onChange={(hidden) => setS({ ...s, hidden })} />
        <button type="button" className={primaryBtn} disabled={!!busy || !valid} onClick={save}>
          {busy ? 'بيتحفظ…' : 'حفظ'}
        </button>
      </div>
    </Modal>
  );
}

function ServicesSection() {
  const { data, error, reload } = useLoad(() => adminRepo.listServices(), []);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<ServiceDraft | null>(null);
  const list = (data ?? []).filter((s) => matches(`${s.name} ${SERVICE_CAT_LABEL[s.cat] ?? ''}`, q));
  return (
    <div>
      <div className="flex gap-2 mt-3 mb-2">
        <input
          className={inputCls}
          type="search"
          value={q}
          placeholder="🔍 دوّر على خدمة"
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className={`${smallBtn} whitespace-nowrap`}
          onClick={() =>
            setEdit({
              cat: 'home',
              emoji: '🛠️',
              name: '',
              description: '',
              price: '',
              numericPrice: null,
              priceType: 'fixed',
              hidden: false,
            })
          }
        >
          + خدمة
        </button>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      <div className="grid gap-2">
        {list.map((s) => (
          <Row
            key={s.id}
            emoji={s.emoji}
            title={s.name}
            sub={`${SERVICE_CAT_LABEL[s.cat] ?? s.cat} · ${s.price}${s.hidden ? ' · مخفية' : ''}`}
            dim={s.hidden}
            onClick={() => setEdit(s)}
          />
        ))}
      </div>
      {edit && (
        <ServiceForm
          initial={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

// ─── Providers ──────────────────────────────────────────────────────────────────────────

type ProviderDraft = Omit<AdminProvider, 'id'> & { id?: number };

function ProviderForm({
  initial,
  services,
  onClose,
  onSaved,
}: {
  initial: ProviderDraft;
  services: AdminService[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [p, setP] = useState(initial);
  const { busy, run } = useAction();
  const valid =
    p.name.trim().length >= 2 &&
    p.serviceId > 0 &&
    (p.priceType === 'quote' || (p.numericPrice != null && p.numericPrice >= 0));
  const save = async () => {
    const ok = await run(
      'save',
      () =>
        adminRepo.saveProvider({
          ...p,
          price: priceText(p.priceType, p.numericPrice),
        }),
      'اتحفظ مقدم الخدمة',
    );
    if (ok) onSaved();
  };
  return (
    <Modal isOpen onClose={onClose} title={p.id ? 'تعديل مقدم خدمة' : 'مقدم خدمة جديد'} emoji="🧑‍🔧">
      <div className="grid gap-3" dir="rtl">
        <Field label="الاسم">
          <input
            className={inputCls}
            value={p.name}
            maxLength={60}
            onChange={(e) => setP({ ...p, name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="الشغلانة">
            <select className={inputCls} value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value })}>
              {Object.entries(PROVIDER_KIND_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="النوع">
            <select
              className={inputCls}
              value={p.gender}
              onChange={(e) => setP({ ...p, gender: e.target.value as 'male' | 'female' })}
            >
              <option value="male">راجل</option>
              <option value="female">ست</option>
            </select>
          </Field>
        </div>
        <Field label="الخدمة اللي بيقدمها">
          <select
            className={inputCls}
            value={p.serviceId || ''}
            onChange={(e) => setP({ ...p, serviceId: Number(e.target.value) })}
          >
            <option value="">اختار خدمة</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="القرية">
          <input
            className={inputCls}
            value={p.village}
            maxLength={60}
            onChange={(e) => setP({ ...p, village: e.target.value })}
          />
        </Field>
        <Field label="نبذة قصيرة">
          <textarea
            className={`${inputCls} py-2 min-h-[70px]`}
            value={p.bio}
            maxLength={300}
            onChange={(e) => setP({ ...p, bio: e.target.value })}
          />
        </Field>
        <PriceFields
          priceType={p.priceType}
          amount={p.numericPrice}
          onChange={(priceType, numericPrice) => setP({ ...p, priceType, numericPrice })}
        />
        <PhotoField folder="providers" value={p.photo} onChange={(photo) => setP({ ...p, photo })} />
        <Toggle label="ظاهر للناس" checked={p.active} onChange={(active) => setP({ ...p, active })} />
        <button type="button" className={primaryBtn} disabled={!!busy || !valid} onClick={save}>
          {busy ? 'بيتحفظ…' : 'حفظ'}
        </button>
      </div>
    </Modal>
  );
}

function ProvidersSection() {
  const { data, error, reload } = useLoad(() => Promise.all([adminRepo.listProviders(), adminRepo.listServices()]), []);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<ProviderDraft | null>(null);
  const services = useMemo(() => data?.[1] ?? [], [data]);
  const serviceName = (id: number) => services.find((s) => s.id === id)?.name ?? '';
  const list = (data?.[0] ?? []).filter((p) => matches(`${p.name} ${p.village} ${serviceName(p.serviceId)}`, q));
  return (
    <div>
      <div className="flex gap-2 mt-3 mb-2">
        <input
          className={inputCls}
          type="search"
          value={q}
          placeholder="🔍 الاسم، القرية، الخدمة"
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className={`${smallBtn} whitespace-nowrap`}
          onClick={() =>
            setEdit({
              kind: 'worker',
              serviceId: 0,
              name: '',
              gender: 'male',
              photo: null,
              price: '',
              numericPrice: null,
              priceType: 'fixed',
              village: '',
              bio: '',
              active: true,
            })
          }
        >
          + مقدم خدمة
        </button>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      <div className="grid gap-2">
        {list.map((p) => (
          <Row
            key={p.id}
            photo={p.photo}
            emoji={p.gender === 'female' ? '👩' : '👨'}
            title={p.name}
            sub={`${PROVIDER_KIND_LABEL[p.kind] ?? p.kind} · ${serviceName(p.serviceId)} · ${p.price}${p.active ? '' : ' · مخفي'}`}
            dim={!p.active}
            onClick={() => setEdit(p)}
          />
        ))}
      </div>
      {edit && (
        <ProviderForm
          initial={edit}
          services={services}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

export default function CatalogTab() {
  const [sub, setSub] = useState<Sub>('shops');
  return (
    <div>
      <div className="grid grid-cols-3 gap-1 mt-3 p-1 rounded-xl bg-white border border-black/5">
        {(
          [
            ['shops', 'المحلات'],
            ['services', 'الخدمات'],
            ['providers', 'مقدمي الخدمات'],
          ] as [Sub, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSub(id)}
            className={`min-h-[40px] rounded-lg border-0 text-[13px] font-extrabold cursor-pointer font-['Cairo',sans-serif] ${
              sub === id ? 'bg-green text-white' : 'bg-transparent text-green-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {sub === 'shops' && <ShopsSection />}
      {sub === 'services' && <ServicesSection />}
      {sub === 'providers' && <ProvidersSection />}
    </div>
  );
}
