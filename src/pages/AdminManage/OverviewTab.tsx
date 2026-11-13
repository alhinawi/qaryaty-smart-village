// ─── الملخص: today's and this week's numbers, and what's waiting for you
import { Link } from 'react-router';
import { ROUTES } from '@/routes';
import { adminRepo } from '@/repositories';
import { formatEGP, ORDER_STATUS_LABEL, ORDER_STATUSES, pendingTotal } from '@/repositories/admin/logic';
import type { AdminMoney } from '@/repositories/admin/types';
import { Card, ErrorBox, Loading, SectionTitle } from './ui';
import { smallBtn, useLoad } from './shared';
import type { AdminTab } from './tabs';

function MoneyCard({ title, m }: { title: string; m: AdminMoney }) {
  return (
    <Card>
      <p className="text-[13px] font-bold text-text-muted m-0">{title}</p>
      <p className="text-[1.6rem] font-black text-green-dark m-0 leading-tight">
        {m.orders.toLocaleString('ar-EG')} طلب
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
        <div>
          <span className="block text-text-muted">مبيعات</span>
          <b>{formatEGP(m.revenue)}</b>
        </div>
        <div>
          <span className="block text-text-muted">عمولة التطبيق</span>
          <b className="text-green">{formatEGP(m.commission)}</b>
        </div>
      </div>
    </Card>
  );
}

function PendingRow({
  emoji,
  label,
  count,
  onOpen,
  to,
}: {
  emoji: string;
  label: string;
  count: number;
  onOpen?: () => void;
  to?: string;
}) {
  const body = (
    <>
      <span className="text-xl" aria-hidden="true">
        {emoji}
      </span>
      <span className="flex-1 text-start font-bold text-[14px]">{label}</span>
      <span
        className={`min-w-[32px] h-8 px-2 rounded-full inline-flex items-center justify-center font-black text-sm ${
          count > 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-text-muted'
        }`}
      >
        {count.toLocaleString('ar-EG')}
      </span>
      <span aria-hidden="true" className="text-text-muted">
        ←
      </span>
    </>
  );
  const cls =
    "w-full flex items-center gap-3 min-h-[52px] px-3 py-2 rounded-xl bg-white border border-black/5 no-underline text-text cursor-pointer font-['Cairo',sans-serif]";
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={onOpen}>
      {body}
    </button>
  );
}

export default function OverviewTab({ onOpen }: { onOpen: (t: AdminTab) => void }) {
  const { data: o, error, loading, reload } = useLoad(() => adminRepo.overview(), []);

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!o) return <Loading />;
  const waiting = pendingTotal(o);

  return (
    <div className={loading ? 'opacity-70' : ''}>
      <SectionTitle
        action={
          <button type="button" className={smallBtn} onClick={reload} disabled={loading}>
            ↻ حدّث
          </button>
        }
      >
        الطلبات والفلوس
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <MoneyCard title="النهارده" m={o.today} />
        <MoneyCard title="آخر 7 أيام" m={o.week} />
      </div>
      <p className="text-[12px] text-text-muted mt-2 mb-0">
        الطلبات الملغية مش محسوبة. كل الوقت: {o.allTime.orders.toLocaleString('ar-EG')} طلب بـ{' '}
        {formatEGP(o.allTime.revenue)}، والعمولة على الطلبات اللي اتسلّمت {formatEGP(o.commissionDone)}.
      </p>

      <SectionTitle>
        مستنية منك {waiting > 0 && <span className="text-red-600">({waiting.toLocaleString('ar-EG')})</span>}
      </SectionTitle>
      <div className="grid gap-2">
        <PendingRow emoji="📦" label="طلبات مستنية تأكيد" count={o.pending.orders} onOpen={() => onOpen('orders')} />
        <PendingRow emoji="🗂️" label="وظايف مستنية مراجعة" count={o.pending.jobs} to={ROUTES.jobsReview} />
        <PendingRow
          emoji="🚩"
          label="إعلانات مستعمل اتبلّغ عنها"
          count={o.pending.marketHidden}
          to={ROUTES.marketReview}
        />
        <PendingRow
          emoji="🚗"
          label="مشاوير شير اتبلّغ عنها"
          count={o.pending.ridesHidden}
          to={ROUTES.ridesReview}
        />
        <PendingRow
          emoji="🤲"
          label="طلبات باب الخير الجديدة"
          count={o.pending.donations}
          onOpen={() => onOpen('donations')}
        />
      </div>

      <SectionTitle>المستخدمين</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {[
          ['جدد النهارده', o.users.today],
          ['جدد الأسبوع', o.users.week],
          ['الكل', o.users.total],
        ].map(([label, n]) => (
          <Card key={label as string} className="!p-3 text-center">
            <p className="text-[1.3rem] font-black text-green-dark m-0">{(n as number).toLocaleString('ar-EG')}</p>
            <p className="text-[12px] text-text-muted m-0">{label}</p>
          </Card>
        ))}
      </div>

      <SectionTitle>كود أول طلب (QARYA1)</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 gap-2 text-[14px]">
          <div>
            <span className="block text-text-muted text-[13px]">طلبات استخدمت الكود</span>
            <b className="text-[1.3rem]">{o.promo.orders.toLocaleString('ar-EG')}</b>
          </div>
          <div>
            <span className="block text-text-muted text-[13px]">رسوم اتلغت</span>
            <b className="text-[1.3rem]">{formatEGP(o.promo.feesWaived)}</b>
          </div>
        </div>
      </Card>

      <SectionTitle>الطلبات حسب الحالة</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((s) => (
          <span key={s} className="px-3 py-1.5 rounded-full bg-white border border-black/10 text-[13px] font-bold">
            {ORDER_STATUS_LABEL[s]}: {o.statusCounts[s].toLocaleString('ar-EG')}
          </span>
        ))}
      </div>

      <SectionTitle>اختصارات</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={smallBtn} onClick={() => onOpen('catalog')}>
          🏪 المحلات والأسعار
        </button>
        <button type="button" className={smallBtn} onClick={() => onOpen('villages')}>
          🏘️ القرى ({o.villagesServed.toLocaleString('ar-EG')} بنوصّلها)
        </button>
        <Link to={ROUTES.jobsReview} className={`${smallBtn} no-underline`}>
          🗂️ مراجعة الوظائف
        </Link>
        <Link to={ROUTES.marketReview} className={`${smallBtn} no-underline`}>
          🚩 بلاغات المستعمل
        </Link>
        <Link to={ROUTES.ridesReview} className={`${smallBtn} no-underline`}>
          🚗 بلاغات شير المواصلة
        </Link>
      </div>
    </div>
  );
}
