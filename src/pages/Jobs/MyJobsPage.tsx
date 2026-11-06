// ─── إعلاناتي: the signed-in person's job posts, every status
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { ROUTES } from '@/routes';
import { jobRepo } from '@/repositories';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import type { Job } from '@/repositories/jobs/types';
import { BackLink, JobCard } from './parts';
import { primaryBtn } from './jobUi';

export default function MyJobsPage() {
  const user = useAuthStore(selectUser);
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    jobRepo
      .listMine(user.id)
      .then((list) => alive && setJobs(list))
      .catch(() => alive && setJobs([]));
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) return <Navigate to={ROUTES.login} state={{ from: ROUTES.jobsMine }} replace />;

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <BackLink />
      <div className="flex items-center justify-between gap-3 mt-1 mb-4">
        <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0">📄 إعلاناتي</h1>
        <Link to={ROUTES.jobsNew} className={primaryBtn}>
          + أضف وظيفة
        </Link>
      </div>
      {jobs === null ? (
        <div className="h-[96px] bg-white rounded-2xl animate-pulse" aria-busy="true" />
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="font-extrabold m-0">لسه مانزّلتش أي إعلان</p>
          <p className="text-[13px] text-text-muted mt-1 m-0">لو محتاج حد يشتغل معاك، دوس «أضف وظيفة».</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard job={job} showStatus />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
