// ─── One job: details, call / WhatsApp, report; the owner's and the admin's controls
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ROUTES, jobEditPath, jobPath } from '@/routes';
import { jobRepo } from '@/repositories';
import { Modal } from '@/components/ui/Modal';
import {
  JOB_REPORT_REASONS,
  canRenew,
  daysLeft,
  isLive,
  jobPhoneLink,
  jobTypeLabel,
  jobWhatsappLink,
  postedAgo,
} from '@/config/jobs';
import { useAuthStore, selectCanReview, selectUser } from '@/stores/useAuthStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { useUIStore } from '@/stores/useUIStore';
import type { Job, JobReportReason } from '@/repositories/jobs/types';
import { BackLink, JobTypeBadge, SafetyNote, StatusBadge } from './parts';
import { dangerBtn, outlineBtn, primaryBtn, useSignInFirst } from './jobUi';

function errorText(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'حصلت مشكلة، جرّب تاني';
}

export default function JobDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const canReview = useAuthStore(selectCanReview);
  const showToast = useUIStore((s) => s.showToast);
  const signInFirst = useSignInFirst();
  // The job loaded for this id; undefined while another id's is still showing
  const [loaded, setLoaded] = useState<{ id: string; job: Job | null } | null>(null);
  const job = loaded && loaded.id === id ? loaded.job : undefined;
  const setJob = (next: Job | null) => setLoaded({ id, job: next });
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    jobRepo
      .get(id)
      .then((j) => alive && setLoaded({ id, job: j }))
      .catch(() => alive && setLoaded({ id, job: null }));
    return () => {
      alive = false;
    };
  }, [id, user?.id]);

  if (job === undefined) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-5" aria-busy="true">
        <div className="h-[260px] bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
        <BackLink />
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm mt-2">
          <div className="text-4xl mb-2" aria-hidden="true">
            💭
          </div>
          <p className="font-extrabold m-0">الإعلان ده مش موجود</p>
          <p className="text-[13px] text-text-muted mt-1 mb-4">ممكن يكون صاحبه قفله، أو مدته خلصت.</p>
          <Link to={ROUTES.jobs} className={primaryBtn}>
            شوف باقي الوظائف
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = !!user && user.id === job.ownerId;
  const live = isLive(job);
  const left = daysLeft(job);

  const run = async (fn: () => Promise<Job | void>, done: string) => {
    setBusy(true);
    try {
      const next = await fn();
      if (next) setJob(next);
      showToast(done);
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await useConfirmStore.getState().ask({
      title: 'تمسح الإعلان؟',
      message: `«${job.title}» هيتمسح خالص، ومش هتقدر ترجّعه.`,
      confirmLabel: 'امسح',
      cancelLabel: 'لأ',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await jobRepo.remove(job.id);
      showToast('اتمسح الإعلان');
      navigate(isOwner ? ROUTES.jobsMine : ROUTES.jobs, { replace: true });
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
      setBusy(false);
    }
  };

  const close = async () => {
    const ok = await useConfirmStore.getState().ask({
      title: 'تقفل الإعلان؟',
      message: 'الإعلان هيختفي من الوظائف. لو فتحته تاني هيروح للمراجعة الأول.',
      confirmLabel: 'اقفله',
      cancelLabel: 'لأ',
    });
    if (ok) await run(() => jobRepo.close(job.id), 'اتقفل الإعلان، ربنا يوفقك');
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <BackLink to={isOwner && !live ? ROUTES.jobsMine : ROUTES.jobs} label={isOwner && !live ? 'إعلاناتي' : 'الوظائف'} />

      {(isOwner || canReview) && !live && (
        <div className="bg-[#FFF8E1] border border-gold-light rounded-2xl p-3 text-[13px] mb-3 mt-1" role="status">
          {job.status === 'pending' && '⏳ الإعلان مستني مراجعة الإدارة، ومحدش شايفه غيرك دلوقتي.'}
          {job.status === 'rejected' &&
            `❌ الإدارة مانشرتش الإعلان${job.rejectReason ? `: ${job.rejectReason}` : '.'} عدّله وهيروح للمراجعة تاني.`}
          {job.status === 'closed' && '🔒 الإعلان مقفول، ومش ظاهر في الوظائف.'}
          {job.status === 'approved' && '⌛ مدة الإعلان خلصت. جدّده علشان يظهر 30 يوم كمان.'}
        </div>
      )}

      <article className="bg-white rounded-2xl p-5 shadow-sm mt-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[clamp(1.2rem,4vw,1.5rem)] font-black text-text m-0 leading-snug">{job.title}</h1>
          {isOwner || canReview ? <StatusBadge job={job} /> : <JobTypeBadge job={job} />}
        </div>
        <p className="text-[14px] text-text-muted m-0 mt-1">
          🏪 {job.employer} · 📍 {job.village}
        </p>

        <dl className="grid grid-cols-2 gap-2 mt-4 mb-0">
          <div className="bg-cream rounded-xl p-3">
            <dt className="text-[11px] text-text-muted">نوع الشغل</dt>
            <dd className="m-0 font-extrabold text-[14px]">{jobTypeLabel(job.type)}</dd>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <dt className="text-[11px] text-text-muted">المرتب</dt>
            <dd className="m-0 font-extrabold text-[14px] text-green-dark">{job.salary || 'بالاتفاق'}</dd>
          </div>
          {job.hours && (
            <div className="bg-cream rounded-xl p-3 col-span-2">
              <dt className="text-[11px] text-text-muted">المواعيد</dt>
              <dd className="m-0 font-extrabold text-[14px]">{job.hours}</dd>
            </div>
          )}
        </dl>

        <h2 className="text-[15px] font-extrabold text-green-dark mt-5 mb-1">تفاصيل الشغل</h2>
        <p className="text-[14px] leading-relaxed whitespace-pre-line m-0">{job.description}</p>

        <p className="text-[12px] text-text-muted mt-4 mb-0">
          اتنشر {postedAgo(job.approvedAt ?? job.createdAt)}
          {live && left !== null && ` · فاضل ${left} يوم على الإعلان`}
        </p>
      </article>

      {/* Contact */}
      {!isOwner && (
        <section className="bg-white rounded-2xl p-4 shadow-sm mt-3" aria-labelledby="jobContactTitle">
          <h2 id="jobContactTitle" className="text-[15px] font-extrabold text-green-dark m-0 mb-3">
            كلّم صاحب الشغل
          </h2>
          <div className="flex flex-wrap gap-2">
            <a href={jobPhoneLink(job.phone)} className={`${primaryBtn} flex-1 min-w-[140px]`}>
              📞 اتصل
            </a>
            {job.whatsapp && (
              <a
                href={jobWhatsappLink(job)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${outlineBtn} flex-1 min-w-[140px] !border-[#25D366] !text-[#128C7E]`}
              >
                💬 واتساب
              </a>
            )}
          </div>
          <p className="text-[12px] text-text-muted mt-2 mb-0" dir="ltr" style={{ textAlign: 'right' }}>
            {job.phone}
          </p>
        </section>
      )}

      <div className="mt-3">
        <SafetyNote />
      </div>

      {/* Report */}
      {!isOwner && live && (
        <button
          type="button"
          className="mt-3 min-h-[44px] w-full rounded-xl bg-transparent border-0 text-[13px] font-bold text-[#b42318] cursor-pointer font-[Cairo,sans-serif]"
          onClick={() => (user ? setReportOpen(true) : signInFirst(jobPath(job.id)))}
        >
          🚩 بلّغ عن الإعلان ده (نصب أو وظيفة مش حقيقية)
        </button>
      )}

      {/* The owner's controls */}
      {isOwner && (
        <section className="bg-white rounded-2xl p-4 shadow-sm mt-3" aria-label="تحكم في إعلانك">
          <div className="flex flex-wrap gap-2">
            <Link to={jobEditPath(job.id)} className={`${outlineBtn} flex-1`}>
              ✏️ عدّل
            </Link>
            {canRenew(job) && (
              <button
                type="button"
                disabled={busy}
                className={`${primaryBtn} flex-1`}
                onClick={() => run(() => jobRepo.renew(job.id), 'اتجدّد الإعلان 30 يوم')}
              >
                🔄 جدّد 30 يوم
              </button>
            )}
            {job.status === 'closed' ? (
              <button
                type="button"
                disabled={busy}
                className={`${outlineBtn} flex-1`}
                onClick={() => run(() => jobRepo.reopen(job.id), 'الإعلان راح للمراجعة')}
              >
                🔓 افتحه تاني
              </button>
            ) : (
              job.status !== 'rejected' && (
                <button type="button" disabled={busy} className={`${outlineBtn} flex-1`} onClick={close}>
                  ✅ لقيت حد، اقفل الإعلان
                </button>
              )
            )}
            <button type="button" disabled={busy} className={`${dangerBtn} flex-1`} onClick={remove}>
              🗑️ امسح
            </button>
          </div>
        </section>
      )}

      {/* Admin */}
      {canReview && !isOwner && (
        <section className="bg-white rounded-2xl p-4 shadow-sm mt-3 border-2 border-gold-light" aria-label="الإدارة">
          <p className="text-[13px] font-extrabold text-green-dark m-0 mb-2">
            ⚙️ الإدارة{job.reportsCount > 0 && ` · اتبلّغ عنه ${job.reportsCount} مرة`}
          </p>
          <div className="flex flex-wrap gap-2">
            {job.status !== 'approved' && (
              <button
                type="button"
                disabled={busy}
                className={`${primaryBtn} flex-1`}
                onClick={() => run(() => jobRepo.review(job.id, true), 'اتنشر الإعلان')}
              >
                ✔️ انشر
              </button>
            )}
            {job.status !== 'rejected' && (
              <button
                type="button"
                disabled={busy}
                className={`${outlineBtn} flex-1`}
                onClick={() => run(() => jobRepo.review(job.id, false, 'مخالف لشروط النشر'), 'اترفض الإعلان')}
              >
                ✖️ ارفض
              </button>
            )}
            <button type="button" disabled={busy} className={`${dangerBtn} flex-1`} onClick={remove}>
              🗑️ امسح
            </button>
          </div>
        </section>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSend={async (reason, note) => {
          try {
            await jobRepo.report(job.id, reason, note);
            setReportOpen(false);
            showToast('شكرًا، الإدارة هتراجع الإعلان');
          } catch (err) {
            showToast(`⚠️ ${errorText(err)}`);
          }
        }}
      />
    </div>
  );
}

function ReportModal({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (reason: JobReportReason, note: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<JobReportReason>('asks_money');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  return (
    <Modal isOpen={open} onClose={onClose} title="بلّغ عن الإعلان" emoji="🚩" maxWidth="440px">
      <form
        dir="rtl"
        onSubmit={async (e) => {
          e.preventDefault();
          setSending(true);
          await onSend(reason, note);
          setSending(false);
        }}
      >
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="text-[13px] text-text-muted mb-2">إيه المشكلة؟</legend>
          {JOB_REPORT_REASONS.map((r) => (
            <label
              key={r.id}
              className={`flex items-center gap-2 min-h-[44px] px-3 rounded-xl border-2 cursor-pointer text-[14px] font-bold ${
                reason === r.id ? 'border-green bg-[#E6F4EC]' : 'border-[#e5e7eb]'
              }`}
            >
              <input
                type="radio"
                name="jobReportReason"
                value={r.id}
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
              />
              {r.label}
            </label>
          ))}
        </fieldset>
        <div className="form-group mt-3">
          <label htmlFor="jobReportNote">تفاصيل (لو حابب)</label>
          <textarea
            id="jobReportNote"
            rows={3}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلًا: طلب مني 500 جنيه علشان الورق"
          />
        </div>
        <button type="submit" disabled={sending} className={`${primaryBtn} w-full mt-2`}>
          {sending ? 'بنبعت…' : 'ابعت البلاغ'}
        </button>
      </form>
    </Modal>
  );
}
