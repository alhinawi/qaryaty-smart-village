// ─── Admin: job posts waiting for review (new, edited, or reported 3 times)
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { ROUTES } from '@/routes';
import { jobRepo } from '@/repositories';
import { jobTypeLabel, postedAgo } from '@/config/jobs';
import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import type { Job } from '@/repositories/jobs/types';
import { BackLink } from './parts';
import { outlineBtn, primaryBtn } from './jobUi';

export default function JobsReviewPage() {
  const isAdmin = useAuthStore(selectIsAdmin);
  const showToast = useUIStore((s) => s.showToast);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    jobRepo
      .listForReview()
      .then((list) => alive && setJobs(list))
      .catch((err) => {
        if (!alive) return;
        setJobs([]);
        setError(err instanceof Error ? err.message : 'ماقدرناش نجيب الإعلانات');
      });
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to={ROUTES.jobs} replace />;

  const review = async (job: Job, approve: boolean) => {
    setBusyId(job.id);
    try {
      await jobRepo.review(job.id, approve, reasons[job.id]);
      setJobs((list) => (list ?? []).filter((j) => j.id !== job.id));
      showToast(approve ? `اتنشر «${job.title}»` : `اترفض «${job.title}»`);
    } catch (err) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'حصلت مشكلة'}`);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <BackLink />
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mt-1">🗂️ مراجعة الوظائف</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-4">
        الإعلانات الجديدة واللي اتعدّلت، واللي اتبلّغ عنها 3 مرات. ارفض أي إعلان بيطلب فلوس من اللي بيدوّر على شغل.
      </p>
      {error && (
        <p className="input-error-msg" role="alert">
          {error}
        </p>
      )}
      {jobs === null ? (
        <div className="h-[160px] bg-white rounded-2xl animate-pulse" aria-busy="true" />
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-4xl mb-2" aria-hidden="true">
            ✅
          </div>
          <p className="font-extrabold m-0">مفيش إعلانات مستنية مراجعة</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {jobs.map((job) => (
            <li key={job.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[15px] font-extrabold m-0">{job.title}</h2>
                {job.reportsCount > 0 && (
                  <span className="shrink-0 text-[11px] font-extrabold rounded-full px-2.5 py-1 bg-[#FDECEC] text-[#b42318]">
                    🚩 {job.reportsCount} بلاغ
                  </span>
                )}
              </div>
              <p className="text-[13px] text-text-muted m-0 mt-0.5">
                {job.employer} · 📍 {job.village} · {jobTypeLabel(job.type)} · {postedAgo(job.updatedAt)}
              </p>
              <p className="text-[13px] m-0 mt-1">
                {job.salary && <>💰 {job.salary} · </>}
                {job.hours && <>🕒 {job.hours} · </>}
                <span dir="ltr">📞 {job.phone}</span>
              </p>
              <p className="text-[14px] leading-relaxed whitespace-pre-line mt-2 mb-3 bg-cream rounded-xl p-3">
                {job.description}
              </p>
              <label className="sr-only" htmlFor={`reason-${job.id}`}>
                سبب الرفض
              </label>
              <input
                id={`reason-${job.id}`}
                placeholder="سبب الرفض (اختياري، صاحب الإعلان هيشوفه)"
                maxLength={200}
                value={reasons[job.id] ?? ''}
                onChange={(e) => setReasons((r) => ({ ...r, [job.id]: e.target.value }))}
                className="w-full min-h-[44px] rounded-xl border-2 border-[#e5e7eb] px-3 text-[14px] mb-2 font-[Cairo,sans-serif]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === job.id}
                  className={`${primaryBtn} flex-1`}
                  onClick={() => review(job, true)}
                >
                  ✔️ انشر
                </button>
                <button
                  type="button"
                  disabled={busyId === job.id}
                  className={`${outlineBtn} flex-1`}
                  onClick={() => review(job, false)}
                >
                  ✖️ ارفض
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
