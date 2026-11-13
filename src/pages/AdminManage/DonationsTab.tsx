// ─── باب الخير: donation requests, call the donor, mark what happened
import { useState } from 'react';
import { adminRepo } from '@/repositories';
import { DONATION_STATUS_LABEL } from '@/repositories/admin/logic';
import type { AdminDonation, DonationStatus } from '@/repositories/admin/types';
import { Empty, ErrorBox, Loading } from './ui';
import { formatDateTime, inputCls, smallBtn, useAction, useLoad } from './shared';

const TYPE_LABEL: Record<string, string> = {
  money: 'فلوس',
  food: 'أكل',
  clothes: 'هدوم',
  furniture: 'عفش',
  other: 'تاني',
};

const TONE: Record<DonationStatus, string> = {
  new: 'bg-amber-100 text-amber-800',
  contacted: 'bg-sky-100 text-sky-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

function DonationCard({ d, onSaved }: { d: AdminDonation; onSaved: (d: AdminDonation) => void }) {
  const { busy, run } = useAction();
  const [note, setNote] = useState(d.adminNote);
  const set = (status: DonationStatus) =>
    run(
      status,
      async () => {
        await adminRepo.setDonation(d.id, status, note);
        onSaved({ ...d, status, adminNote: note });
      },
      `اتحفظ: ${DONATION_STATUS_LABEL[status]}`,
    );
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 font-extrabold text-[14px]">{d.donorName}</p>
          <p className="m-0 text-[12px] text-text-muted">
            {d.causeName} · {TYPE_LABEL[d.donationType] ?? d.donationType} · {formatDateTime(d.createdAt)}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[12px] font-extrabold whitespace-nowrap ${TONE[d.status]}`}>
          {DONATION_STATUS_LABEL[d.status]}
        </span>
      </div>
      <a
        href={`tel:${d.phone}`}
        dir="ltr"
        className="inline-block mt-1 text-[14px] text-green-dark font-bold no-underline"
      >
        📞 {d.phone}
      </a>
      {d.notes && <p className="m-0 mt-1 text-[13px]">📝 {d.notes}</p>}
      <input
        className={`${inputCls} mt-2 !min-h-[40px] text-[13px]`}
        value={note}
        maxLength={500}
        placeholder="ملحوظة ليك (محدش بيشوفها غير الأدمن)"
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {(['contacted', 'done', 'cancelled'] as DonationStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            className={smallBtn}
            disabled={!!busy || (s === d.status && note === d.adminNote)}
            onClick={() => set(s)}
          >
            {busy === s ? 'لحظة…' : DONATION_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DonationsTab() {
  const { data, setData, error, reload } = useLoad(() => adminRepo.listDonations(), []);
  const [filter, setFilter] = useState<DonationStatus | 'all'>('new');
  const list = (data ?? []).filter((d) => filter === 'all' || d.status === filter);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-3">
        {(['new', 'contacted', 'done', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`${smallBtn} ${filter === f ? '!bg-green !text-white' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'الكل' : DONATION_STATUS_LABEL[f]}
            {data &&
              ` (${(f === 'all' ? data.length : data.filter((d) => d.status === f).length).toLocaleString('ar-EG')})`}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2">
        {error && <ErrorBox message={error} onRetry={reload} />}
        {!data && !error && <Loading />}
        {data && list.length === 0 && <Empty>مفيش طلبات هنا</Empty>}
        {list.map((d) => (
          <DonationCard
            key={d.id}
            d={d}
            onSaved={(n) => setData((all) => (all ?? []).map((x) => (x.id === n.id ? n : x)))}
          />
        ))}
      </div>
    </div>
  );
}
