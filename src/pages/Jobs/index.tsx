// ─── وظائف: the list of live job posts, with search and filters
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/routes';
import { jobRepo } from '@/repositories';
import { JOB_TYPES, filterJobs, jobVillages } from '@/config/jobs';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import type { Job, JobType } from '@/repositories/jobs/types';
import { JobCard, SafetyNote } from './parts';
import { outlineBtn, primaryBtn, useSignInFirst } from './jobUi';

export default function JobsPage() {
  const user = useAuthStore(selectUser);
  const signInFirst = useSignInFirst();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [query, setQuery] = useState('');
  const [village, setVillage] = useState('');
  const [type, setType] = useState<JobType | ''>('');

  useEffect(() => {
    let alive = true;
    jobRepo
      .listPublic()
      .then((list) => alive && setJobs(list))
      .catch(() => alive && setJobs([]));
    return () => {
      alive = false;
    };
  }, []);

  const villages = useMemo(() => jobVillages(jobs ?? []), [jobs]);
  const shown = useMemo(() => filterJobs(jobs ?? [], { query, village, type }), [jobs, query, village, type]);
  const filtered = query.trim() !== '' || village !== '' || type !== '';

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[clamp(1.3rem,4vw,1.7rem)] font-black text-green-dark m-0">💼 وظائف</h1>
          <p className="text-[13px] text-text-muted m-0 mt-1">شغل في قريتك والقرى اللي جنبك، من المحلات والناس اللي تعرفهم.</p>
        </div>
        {user ? (
          <Link to={ROUTES.jobsNew} className={`${primaryBtn} shrink-0`}>
            + أضف وظيفة
          </Link>
        ) : (
          <button type="button" className={`${primaryBtn} shrink-0`} onClick={() => signInFirst(ROUTES.jobsNew)}>
            + أضف وظيفة
          </button>
        )}
      </header>

      {user && (
        <Link to={ROUTES.jobsMine} className="inline-flex items-center min-h-[44px] text-sm font-bold text-green-dark mb-2">
          📄 إعلاناتي
        </Link>
      )}

      <div className="bg-white rounded-2xl p-3 shadow-sm mb-4 flex flex-col gap-3">
        <label className="sr-only" htmlFor="jobsSearch">
          دوّر في الوظائف
        </label>
        <input
          id="jobsSearch"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 دوّر: بائع، سواق، مدرس…"
          className="w-full min-h-[44px] rounded-xl border-2 border-[#e5e7eb] px-3 text-[15px] font-[Cairo,sans-serif] focus:border-green outline-none"
        />
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="نوع الشغل">
          {[{ id: '' as const, label: 'الكل', icon: '' }, ...JOB_TYPES].map((t) => (
            <button
              key={t.id || 'all'}
              type="button"
              aria-pressed={type === t.id}
              onClick={() => setType(t.id)}
              className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-[13px] font-bold border-2 cursor-pointer font-[Cairo,sans-serif] ${
                type === t.id ? 'bg-green text-white border-green' : 'bg-white text-text border-[#e5e7eb]'
              }`}
            >
              {t.icon && <span aria-hidden="true">{t.icon} </span>}
              {t.label}
            </button>
          ))}
        </div>
        {villages.length > 1 && (
          <div>
            <label htmlFor="jobsVillage" className="sr-only">
              القرية
            </label>
            <select
              id="jobsVillage"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border-2 border-[#e5e7eb] px-3 text-[14px] bg-white font-[Cairo,sans-serif]"
            >
              <option value="">📍 كل القرى</option>
              {villages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mb-4">
        <SafetyNote compact />
      </div>

      {jobs === null ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="بنحمّل الوظائف">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[96px] bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : shown.length > 0 ? (
        <>
          <p className="text-[13px] text-text-muted mb-2" aria-live="polite">
            {shown.length === 1 ? 'وظيفة واحدة' : `${shown.length} وظيفة`}
          </p>
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {shown.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-4xl mb-2" aria-hidden="true">
            {filtered ? '🔎' : '💼'}
          </div>
          <p className="font-extrabold text-text m-0">
            {filtered ? 'مفيش وظائف بالشروط دي' : 'لسه مفيش وظائف منشورة'}
          </p>
          <p className="text-[13px] text-text-muted mt-1 mb-4">
            {filtered ? 'جرّب كلمة تانية أو شيل الفلتر.' : 'لو محتاج حد يشتغل معاك، نزّل أول إعلان.'}
          </p>
          {filtered ? (
            <button
              type="button"
              className={outlineBtn}
              onClick={() => {
                setQuery('');
                setVillage('');
                setType('');
              }}
            >
              شيل الفلاتر
            </button>
          ) : user ? (
            <Link to={ROUTES.jobsNew} className={primaryBtn}>
              + أضف وظيفة
            </Link>
          ) : (
            <button type="button" className={primaryBtn} onClick={() => signInFirst(ROUTES.jobsNew)}>
              + أضف وظيفة
            </button>
          )}
        </div>
      )}
    </div>
  );
}
