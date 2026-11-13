// ─── القسايم: create, edit, stop coupons and see how much each one was used
import { useState } from 'react';
import { adminRepo, couponRepo, type AdminCoupon } from '@/repositories';
import {
  COUPON_KIND_LABEL,
  COUPON_TARGET_LABEL,
  couponConditions,
  couponExpiry,
  couponHeadline,
  couponToDraft,
  draftProblem,
  emptyDraft,
  normalizeCouponCode,
  type CouponDraft,
  type CouponKind,
  type CouponTarget,
} from '@/utils/coupons';
import { Card, Empty, ErrorBox, Loading, SectionTitle, Toggle } from './ui';
import { formatDateTime, inputCls, labelCls, outlineBtn, primaryBtn, smallBtn, useAction, useLoad } from './shared';

const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

/** ISO → the value of <input type="datetime-local"> in the device's time (Cairo for the admin). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null);

function CouponForm({
  initial,
  id,
  onDone,
  onCancel,
}: {
  initial: CouponDraft;
  id?: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<CouponDraft>(initial);
  const [error, setError] = useState('');
  const { busy, run } = useAction();
  const shops = useLoad(() => adminRepo.listShops(), []);
  const set = <K extends keyof CouponDraft>(k: K, v: CouponDraft[K]) => setD((old) => ({ ...old, [k]: v }));
  const hasValue = d.kind === 'percent' || d.kind === 'fixed';

  const save = async () => {
    const draft = { ...d, code: normalizeCouponCode(d.code) };
    const problem = draftProblem(draft);
    setError(problem ?? '');
    if (problem) return;
    const ok = await run('save', () => couponRepo.save(draft, id), id ? 'اتحفظ الكوبون' : 'اتعمل الكوبون');
    if (ok) onDone();
  };

  return (
    <Card className="mt-3 grid gap-3">
      <h3 className="m-0 text-[15px] font-black text-green-dark">{id ? `تعديل ${initial.code}` : 'كوبون جديد'}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>الكود</span>
          <input
            className={`${inputCls} uppercase tracking-wider`}
            dir="ltr"
            value={d.code}
            maxLength={20}
            placeholder="EID25"
            onChange={(e) => set('code', normalizeCouponCode(e.target.value))}
          />
        </label>
        <label>
          <span className={labelCls}>العنوان (بيظهر على الكارت)</span>
          <input className={inputCls} value={d.title} maxLength={80} placeholder="خصم العيد" onChange={(e) => set('title', e.target.value)} />
        </label>
      </div>
      <label>
        <span className={labelCls}>الوصف</span>
        <textarea
          className={`${inputCls} min-h-[70px] py-2`}
          value={d.description}
          maxLength={300}
          placeholder="كلام بسيط يقول الكوبون بيعمل إيه"
          onChange={(e) => set('description', e.target.value)}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>نوعه</span>
          <select
            className={inputCls}
            value={d.kind}
            onChange={(e) => {
              const kind = e.target.value as CouponKind;
              setD((old) => ({
                ...old,
                kind,
                value: kind === 'percent' ? 10 : kind === 'fixed' ? 20 : 0,
                appliesTo: kind === 'free_delivery' ? 'products' : old.appliesTo,
              }));
            }}
          >
            {(Object.keys(COUPON_KIND_LABEL) as CouponKind[]).map((k) => (
              <option key={k} value={k}>
                {COUPON_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        {hasValue && (
          <label>
            <span className={labelCls}>{d.kind === 'percent' ? 'النسبة %' : 'المبلغ (جنيه)'}</span>
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              min={1}
              max={d.kind === 'percent' ? 100 : undefined}
              value={d.value || ''}
              onChange={(e) => set('value', Number(e.target.value))}
            />
          </label>
        )}
        {d.kind !== 'fixed' && (
          <label>
            <span className={labelCls}>أقصى خصم (جنيه، فاضي = من غير حد)</span>
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              min={1}
              value={d.maxDiscount ?? ''}
              onChange={(e) => set('maxDiscount', num(e.target.value))}
            />
          </label>
        )}
        <label>
          <span className={labelCls}>أقل طلب (جنيه، 0 = أي طلب)</span>
          <input
            className={inputCls}
            type="number"
            inputMode="decimal"
            min={0}
            value={d.minOrder}
            onChange={(e) => set('minOrder', Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span className={labelCls}>ينفع على</span>
          <select
            className={inputCls}
            value={d.appliesTo}
            disabled={d.kind === 'free_delivery' || d.shopId != null}
            onChange={(e) => set('appliesTo', e.target.value as CouponTarget)}
          >
            {(Object.keys(COUPON_TARGET_LABEL) as CouponTarget[]).map((t) => (
              <option key={t} value={t}>
                {COUPON_TARGET_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>محل معيّن (اختياري)</span>
          <select
            className={inputCls}
            value={d.shopId ?? ''}
            onChange={(e) => {
              const shopId = e.target.value ? Number(e.target.value) : null;
              setD((old) => ({ ...old, shopId, appliesTo: shopId != null ? 'products' : old.appliesTo }));
            }}
          >
            <option value="">أي محل</option>
            {(shops.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>كام مرة لكل حساب (فاضي = من غير حد)</span>
          <input
            className={inputCls}
            type="number"
            inputMode="numeric"
            min={1}
            value={d.perUserLimit ?? ''}
            onChange={(e) => set('perUserLimit', num(e.target.value))}
          />
        </label>
        <label>
          <span className={labelCls}>العدد الكلي (فاضي = من غير حد)</span>
          <input
            className={inputCls}
            type="number"
            inputMode="numeric"
            min={1}
            value={d.totalLimit ?? ''}
            onChange={(e) => set('totalLimit', num(e.target.value))}
          />
        </label>
        <label>
          <span className={labelCls}>يبدأ من (اختياري)</span>
          <input
            className={inputCls}
            type="datetime-local"
            value={toLocalInput(d.startsAt)}
            onChange={(e) => set('startsAt', fromLocalInput(e.target.value))}
          />
        </label>
        <label>
          <span className={labelCls}>يخلص في (اختياري)</span>
          <input
            className={inputCls}
            type="datetime-local"
            value={toLocalInput(d.endsAt)}
            onChange={(e) => set('endsAt', fromLocalInput(e.target.value))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-x-5">
        <Toggle checked={d.firstOrderOnly} onChange={(v) => set('firstOrderOnly', v)} label="لأول طلب بس" />
        <Toggle checked={d.isPublic} onChange={(v) => set('isPublic', v)} label="يظهر في قسايمي" />
        <Toggle checked={d.active} onChange={(v) => set('active', v)} label="شغال" />
      </div>
      {!d.isPublic && (
        <p className="m-0 text-[12px] text-text-muted">مخفي: مش بيظهر في قسايمي، بس بيشتغل لأي حد عنده الكود.</p>
      )}
      {error && <ErrorBox message={error} />}
      <div className="flex gap-2">
        <button type="button" className={primaryBtn} disabled={!!busy} onClick={save}>
          {busy ? 'لحظة…' : 'حفظ'}
        </button>
        <button type="button" className={outlineBtn} onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </Card>
  );
}

function CouponRow({
  c,
  onEdit,
  onChanged,
}: {
  c: AdminCoupon;
  onEdit: () => void;
  onChanged: (c: AdminCoupon) => void;
}) {
  const { busy, run } = useAction();
  const toggle = (active: boolean) =>
    run('active', async () => {
      await couponRepo.setActive(c.id, active);
      onChanged({ ...c, active });
    }, active ? 'الكوبون اشتغل' : 'الكوبون اتوقف');
  return (
    <div className={`bg-white rounded-2xl border border-black/5 shadow-sm p-3 ${c.active ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 font-black text-[15px] text-green-dark">
            <span dir="ltr" className="tracking-wider">{c.code}</span> · {couponHeadline(c)}
          </p>
          <p className="m-0 text-[13px]">{c.title}</p>
          <p className="m-0 text-[12px] text-text-muted">
            {[...couponConditions(c), couponExpiry(c)].join(' · ')}
            {!c.isPublic && ' · مخفي'}
          </p>
        </div>
        <Toggle checked={c.active} disabled={!!busy} onChange={toggle} label={c.active ? 'شغال' : 'متوقف'} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2 text-center">
        <div className="rounded-xl bg-cream p-2">
          <p className="m-0 text-[18px] font-black text-green-dark">
            {c.uses.toLocaleString('ar-EG')}
            {c.totalLimit != null && <span className="text-[12px] text-text-muted"> / {c.totalLimit.toLocaleString('ar-EG')}</span>}
          </p>
          <p className="m-0 text-[11px] text-text-muted">مرة اتستخدم</p>
        </div>
        <div className="rounded-xl bg-cream p-2">
          <p className="m-0 text-[18px] font-black text-green-dark">{c.users.toLocaleString('ar-EG')}</p>
          <p className="m-0 text-[11px] text-text-muted">شخص</p>
        </div>
        <div className="rounded-xl bg-cream p-2">
          <p className="m-0 text-[18px] font-black text-green-dark">{c.saved.toLocaleString('ar-EG')} ج</p>
          <p className="m-0 text-[11px] text-text-muted">وفّر للناس</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className="text-[11px] text-text-muted">
          {c.lastUsedAt ? `آخر استخدام ${formatDateTime(c.lastUsedAt)}` : 'لسه محدش استخدمه'}
        </span>
        <button type="button" className={smallBtn} onClick={onEdit}>
          ✂️ تعديل
        </button>
      </div>
    </div>
  );
}

export default function CouponsTab() {
  const { data, setData, error, reload } = useLoad(() => couponRepo.listAll(), []);
  const [editing, setEditing] = useState<{ id?: number; draft: CouponDraft } | null>(null);
  const done = () => {
    setEditing(null);
    reload();
  };
  return (
    <div>
      <SectionTitle
        action={
          !editing && (
            <button type="button" className={smallBtn} onClick={() => setEditing({ draft: emptyDraft() })}>
              ➕ كوبون جديد
            </button>
          )
        }
      >
        🎟️ القسايم
      </SectionTitle>
      <p className="m-0 text-[12px] text-text-muted">
        السيرفر بيتأكد من كل كوبون ويحسب خصمه بنفسه في كل طلب. الطلب اللي يتلغي بيرجّع المرة بتاعته.
      </p>
      {editing && (
        <CouponForm
          key={editing.id ?? 'new'}
          initial={editing.draft}
          id={editing.id}
          onDone={done}
          onCancel={() => setEditing(null)}
        />
      )}
      <div className="mt-3 grid gap-2">
        {error && <ErrorBox message={error} onRetry={reload} />}
        {!data && !error && <Loading />}
        {data && data.length === 0 && <Empty>لسه مفيش قسايم</Empty>}
        {(data ?? []).map((c) => (
          <CouponRow
            key={c.id}
            c={c}
            onEdit={() => {
              setEditing({ id: c.id, draft: couponToDraft(c) });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onChanged={(n) => setData((all) => (all ?? []).map((x) => (x.id === n.id ? n : x)))}
          />
        ))}
      </div>
    </div>
  );
}
