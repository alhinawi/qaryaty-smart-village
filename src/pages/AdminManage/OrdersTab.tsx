// ─── الطلبات: filter, open one, move it forward or cancel it
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { adminRepo } from '@/repositories';
import {
  canCancel,
  DATE_PRESET_LABEL,
  formatEGP,
  NEXT_STATUS_ACTION,
  nextOrderStatus,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_STATUSES,
  presetRange,
  type DatePreset,
} from '@/repositories/admin/logic';
import type { AdminOrder, AdminOrderStatus } from '@/repositories/admin/types';
import { Card, Empty, ErrorBox, Loading } from './ui';
import {
  dangerBtn,
  formatDateTime,
  inputCls,
  labelCls,
  outlineBtn,
  primaryBtn,
  smallBtn,
  useAction,
  useLoad,
} from './shared';

function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'كاش',
  card: 'كارت',
  wallet: 'محفظة',
};

function StatusPill({ status }: { status: AdminOrderStatus }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[12px] font-extrabold whitespace-nowrap ${ORDER_STATUS_TONE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

function OrderDetails({
  order,
  onClose,
  onChanged,
}: {
  order: AdminOrder;
  onClose: () => void;
  onChanged: (o: AdminOrder) => void;
}) {
  const { busy, run } = useAction();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [manual, setManual] = useState<AdminOrderStatus>(order.status);
  const next = nextOrderStatus(order.status);

  const setStatus = async (status: AdminOrderStatus, why?: string) => {
    const ok = await run(
      status,
      () => adminRepo.setOrderStatus(order.id, status, why),
      `الطلب ${order.orderNumber}: ${ORDER_STATUS_LABEL[status]}`,
    );
    if (ok)
      onChanged({
        ...order,
        status,
        cancelReason: status === 'cancelled' ? why?.trim() || null : null,
      });
  };

  return (
    <Modal isOpen onClose={onClose} title={`طلب ${order.orderNumber}`} emoji={order.serviceEmoji || '📦'}>
      <div className="grid gap-3 text-[14px]" dir="rtl">
        <div className="flex items-center justify-between gap-2">
          <b>{order.serviceName}</b>
          <StatusPill status={order.status} />
        </div>
        <p className="m-0 text-text-muted text-[13px]">{formatDateTime(order.createdAt)}</p>

        <Card className="!p-3 grid gap-1">
          <span>
            👤 {order.customerName || 'عميل'}{' '}
            {order.customerUsername && <span className="text-text-muted">@{order.customerUsername}</span>}
          </span>
          <a href={`tel:${order.phone}`} className="text-green-dark font-bold no-underline" dir="ltr">
            📞 {order.phone}
          </a>
          <span>📍 {order.address}</span>
          {order.customerVillage && (
            <span className="text-text-muted text-[13px]">القرية في حسابه: {order.customerVillage}</span>
          )}
          {order.notes && <span>📝 {order.notes}</span>}
        </Card>

        {order.items.length > 0 && (
          <div>
            <p className="m-0 mb-1 font-bold">الأصناف</p>
            <ul className="list-none m-0 p-0 grid gap-1">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-2 border-b border-black/5 pb-1">
                  <span>
                    {it.emoji} {it.name} × {it.quantity.toLocaleString('ar-EG')} {it.unit ?? ''}
                  </span>
                  {it.price != null && <span>{formatEGP(it.price * it.quantity)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Card className="!p-3 grid gap-1">
          <div className="flex justify-between">
            <span>الحساب</span>
            <span>{formatEGP(order.subtotal)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>رسوم التوصيل</span>
              <span>{formatEGP(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>عمولة التطبيق</span>
            <span>{formatEGP(order.commission)}</span>
          </div>
          {order.discountCode && (
            <div className="flex justify-between text-green">
              <span>كود {order.discountCode} (رسوم اتلغت)</span>
              <span>{formatEGP(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-[15px]">
            <span>الإجمالي</span>
            <span>{order.total == null ? 'بالاتفاق' : formatEGP(order.total)}</span>
          </div>
          <div className="flex justify-between text-text-muted text-[13px]">
            <span>الدفع</span>
            <span>
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              {order.paymentStatus === 'paid' ? ' (اتدفع)' : ''}
            </span>
          </div>
        </Card>

        {order.status === 'cancelled' && order.cancelReason && (
          <p className="m-0 text-red-700">سبب الإلغاء: {order.cancelReason}</p>
        )}

        {next && (
          <button type="button" className={primaryBtn} disabled={!!busy} onClick={() => setStatus(next)}>
            {busy === next ? 'لحظة…' : `✅ ${NEXT_STATUS_ACTION[order.status]}`}
          </button>
        )}

        {canCancel(order.status) && !cancelling && (
          <button type="button" className={dangerBtn} disabled={!!busy} onClick={() => setCancelling(true)}>
            ✖ الغي الطلب
          </button>
        )}
        {cancelling && (
          <div className="grid gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <label className={labelCls} htmlFor="cancel-reason">
              سبب الإلغاء (اختياري)
            </label>
            <input
              id="cancel-reason"
              className={inputCls}
              maxLength={300}
              value={reason}
              placeholder="مثلاً: العميل مش بيرد"
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className={`${dangerBtn} flex-1`}
                disabled={!!busy}
                onClick={() => setStatus('cancelled', reason)}
              >
                {busy === 'cancelled' ? 'لحظة…' : 'أيوه، الغيه'}
              </button>
              <button type="button" className={outlineBtn} onClick={() => setCancelling(false)}>
                رجوع
              </button>
            </div>
          </div>
        )}

        <details className="text-[13px]">
          <summary className="cursor-pointer text-text-muted min-h-[40px] flex items-center">غيّر الحالة بإيدك</summary>
          <div className="flex gap-2 mt-1">
            <select className={inputCls} value={manual} onChange={(e) => setManual(e.target.value as AdminOrderStatus)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={smallBtn}
              disabled={!!busy || manual === order.status}
              onClick={() => setStatus(manual)}
            >
              حفظ
            </button>
          </div>
        </details>
      </div>
    </Modal>
  );
}

export default function OrdersTab() {
  const [status, setStatus] = useState<AdminOrderStatus | ''>('');
  const [preset, setPreset] = useState<DatePreset>('week');
  const [village, setVillage] = useState('');
  const [search, setSearch] = useState('');
  const v = useDebounced(village);
  const q = useDebounced(search);
  const [open, setOpen] = useState<AdminOrder | null>(null);

  const { data, setData, error, loading, reload } = useLoad(
    () =>
      adminRepo.listOrders({
        status,
        ...presetRange(preset),
        village: v,
        search: q,
      }),
    [status, preset, v, q],
  );

  return (
    <div>
      <div className="grid gap-2 mt-3">
        <input
          className={inputCls}
          type="search"
          value={search}
          placeholder="🔍 رقم الطلب، الموبايل، اسم العميل"
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            className={inputCls}
            value={status}
            aria-label="الحالة"
            onChange={(e) => setStatus(e.target.value as AdminOrderStatus | '')}
          >
            <option value="">كل الحالات</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select
            className={inputCls}
            value={preset}
            aria-label="الفترة"
            onChange={(e) => setPreset(e.target.value as DatePreset)}
          >
            {(Object.keys(DATE_PRESET_LABEL) as DatePreset[]).map((p) => (
              <option key={p} value={p}>
                {DATE_PRESET_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <input
          className={inputCls}
          value={village}
          placeholder="🏘️ القرية (من العنوان أو حساب العميل)"
          onChange={(e) => setVillage(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between mt-3 mb-2">
        <span className="text-[13px] text-text-muted">
          {data ? `${data.length.toLocaleString('ar-EG')} طلب${data.length >= 100 ? ' (أحدث 100)' : ''}` : ''}
        </span>
        <button type="button" className={smallBtn} onClick={reload} disabled={loading}>
          ↻ حدّث
        </button>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && data.length === 0 && <Empty>مفيش طلبات بالفلتر ده</Empty>}

      <div className={`grid gap-2 ${loading ? 'opacity-60' : ''}`}>
        {data?.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOpen(o)}
            className="text-start w-full bg-white rounded-2xl border border-black/5 shadow-sm p-3 cursor-pointer font-['Cairo',sans-serif]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="m-0 font-extrabold text-[14px] truncate">
                  {o.serviceEmoji} {o.serviceName}
                </p>
                <p className="m-0 text-[12px] text-text-muted">
                  {o.orderNumber} · {formatDateTime(o.createdAt)}
                </p>
              </div>
              <StatusPill status={o.status} />
            </div>
            <div className="flex items-center justify-between gap-2 mt-2 text-[13px]">
              <span className="truncate">
                👤 {o.customerName || o.phone} · {o.customerVillage || o.address}
              </span>
              <b className="whitespace-nowrap">{o.total == null ? 'بالاتفاق' : formatEGP(o.total)}</b>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <OrderDetails
          key={open.id + open.status}
          order={open}
          onClose={() => setOpen(null)}
          onChanged={(updated) => {
            setOpen(updated);
            setData((list) => (list ?? []).map((x) => (x.id === updated.id ? updated : x)));
          }}
        />
      )}
    </div>
  );
}
