// ─── Pieces the وظائف pages share
import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';

import { jobPath, ROUTES } from '@/routes';
import {
  JOB_SAFETY_NOTE,
  daysLeft,
  isLive,
  jobTypeLabel,
  JOB_TYPES,
  ownerStatusLabel,
  postedAgo,
  shortVillage,
} from '@/config/jobs';
import type { Job } from '@/repositories/jobs/types';

export function SafetyNote({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 bg-[#FFF8E1] border border-gold-light rounded-2xl text-[13px] leading-relaxed text-text ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <span className="text-lg leading-none shrink-0" aria-hidden="true">
        ⚠️
      </span>
      <p className="m-0">
        <strong className="text-green-dark">خلي بالك: </strong>
        {JOB_SAFETY_NOTE}
      </p>
    </div>
  );
}

export function JobTypeBadge({ job }: { job: Pick<Job, 'type'> }) {
  const icon = JOB_TYPES.find((t) => t.id === job.type)?.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-dark bg-cream rounded-full px-2.5 py-1">
      <span aria-hidden="true">{icon}</span>
      {jobTypeLabel(job.type)}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#FFF3CD] text-[#8a6100]',
  approved: 'bg-[#E6F4EC] text-green-dark',
  rejected: 'bg-[#FDECEC] text-[#b42318]',
  closed: 'bg-[#EEF0F2] text-text-muted',
  ended: 'bg-[#EEF0F2] text-text-muted',
};

export function StatusBadge({ job }: { job: Pick<Job, 'status' | 'expiresAt'> }) {
  const ended = job.status === 'approved' && !isLive(job);
  return (
    <span
      className={`inline-flex items-center text-[11px] font-extrabold rounded-full px-2.5 py-1 ${
        STATUS_STYLES[ended ? 'ended' : job.status]
      }`}
    >
      {ownerStatusLabel(job)}
    </span>
  );
}

export function JobCard({ job, showStatus = false }: { job: Job; showStatus?: boolean }) {
  const left = daysLeft(job);
  return (
    <Link
      to={jobPath(job.id)}
      className="block bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent hover:border-green transition-colors no-underline text-text"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-text m-0 leading-snug">{job.title}</h2>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">
            {job.employer} · 📍 {shortVillage(job.village)}
          </p>
        </div>
        {showStatus ? <StatusBadge job={job} /> : <JobTypeBadge job={job} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[12px] text-text-muted">
        {showStatus && <JobTypeBadge job={job} />}
        {job.salary && <span className="font-bold text-green-dark">💰 {job.salary}</span>}
        {job.hours && <span>🕒 {job.hours}</span>}
        <span>{postedAgo(job.approvedAt ?? job.createdAt)}</span>
        {showStatus && isLive(job) && left !== null && <span>فاضل {left} يوم</span>}
      </div>
    </Link>
  );
}

export function BackLink({ to = ROUTES.jobs, label = 'الوظائف' }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 min-h-[44px] text-sm font-bold text-green-dark no-underline"
    >
      <ChevronLeft size={16} className="shrink-0" aria-hidden="true" /> {label}
    </Link>
  );
}

