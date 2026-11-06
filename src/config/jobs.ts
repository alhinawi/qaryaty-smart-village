// ─── وظائف: labels, the safety note and the small rules the pages share
import { matchesSearch } from '@/utils/arabicSearch';
import type { Job, JobReportReason, JobStatus, JobType } from '@/repositories/jobs/types';

/** A post shows this long after approval, then the owner can renew it */
export const JOB_DAYS = 30;
/** Renew opens this many days before the post ends */
export const JOB_RENEW_WINDOW_DAYS = 7;

export const JOB_TYPES: { id: JobType; label: string; icon: string }[] = [
  { id: 'full_time', label: 'دوام كامل', icon: '🕘' },
  { id: 'part_time', label: 'نص يوم', icon: '⏱️' },
  { id: 'daily', label: 'باليومية', icon: '📅' },
];

export function jobTypeLabel(type: JobType): string {
  return JOB_TYPES.find((t) => t.id === type)?.label ?? '';
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'مستني المراجعة',
  approved: 'منشور',
  rejected: 'اترفض',
  closed: 'مقفول',
};

export const JOB_REPORT_REASONS: { id: JobReportReason; label: string }[] = [
  { id: 'asks_money', label: 'بيطلب فلوس علشان الشغل' },
  { id: 'scam', label: 'نصب' },
  { id: 'fake', label: 'الوظيفة مش حقيقية' },
  { id: 'other', label: 'حاجة تانية' },
];

export const JOB_SAFETY_NOTE =
  'أوعى تدفع أي فلوس علشان تاخد شغل، ولا تبعت صورة بطاقتك قبل ما تقابل صاحب الشغل. اللي يطلب فلوس بلّغ عنه.';

/** Words that bring the jobs banner up in the home search */
export const JOB_SEARCH_WORDS = ['وظيفة', 'وظائف', 'وظايف', 'شغل', 'شغلانة', 'عمل', 'عامل', 'صنايعي', 'يومية'];

const DAY = 24 * 60 * 60 * 1000;

/** Whole days left before the post hides (0 on its last day); null when not approved yet */
export function daysLeft(job: Pick<Job, 'expiresAt'>, now = Date.now()): number | null {
  if (!job.expiresAt) return null;
  return Math.max(0, Math.floor((new Date(job.expiresAt).getTime() - now) / DAY));
}

export function isLive(job: Pick<Job, 'status' | 'expiresAt'>, now = Date.now()): boolean {
  return job.status === 'approved' && !!job.expiresAt && new Date(job.expiresAt).getTime() > now;
}

export function canRenew(job: Pick<Job, 'status' | 'expiresAt'>, now = Date.now()): boolean {
  if (job.status !== 'approved' || !job.expiresAt) return false;
  return new Date(job.expiresAt).getTime() - now <= JOB_RENEW_WINDOW_DAYS * DAY;
}

/** What the owner reads on their own post */
export function ownerStatusLabel(job: Pick<Job, 'status' | 'expiresAt'>, now = Date.now()): string {
  if (job.status === 'approved' && !isLive(job, now)) return 'خلصت مدته';
  return JOB_STATUS_LABELS[job.status];
}

export interface JobFilters {
  query: string;
  village: string;
  type: JobType | '';
}

export function filterJobs(jobs: Job[], { query, village, type }: JobFilters): Job[] {
  return jobs.filter(
    (job) =>
      (!village || job.village === village) &&
      (!type || job.type === type) &&
      matchesSearch(query, [job.title, job.employer, job.village, job.description, job.hours, jobTypeLabel(job.type)])
  );
}

/** The villages that have posts, for the filter, most posts first */
export function jobVillages(jobs: Job[]): string[] {
  const counts = new Map<string, number>();
  for (const job of jobs) counts.set(job.village, (counts.get(job.village) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ar')).map(([v]) => v);
}

/** "منذ 3 أيام" style age of a post */
export function postedAgo(iso: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / DAY);
  if (days <= 0) return 'النهارده';
  if (days === 1) return 'امبارح';
  if (days === 2) return 'من يومين';
  if (days <= 10) return `من ${days} أيام`;
  return `من ${days} يوم`;
}

/** "منية سندوب، مركز المنصورة - الدقهلية" → "منية سندوب" for the cards */
export function shortVillage(village: string): string {
  return village.split('،')[0].trim() || village;
}

export function jobPhoneLink(phone: string): string {
  return `tel:+2${phone}`;
}

export function jobWhatsappLink(job: Pick<Job, 'phone' | 'title'>): string {
  const text = `السلام عليكم، شفت إعلان "${job.title}" على قريتي، وعايز أسأل عليه.`;
  return `https://wa.me/2${job.phone}?text=${encodeURIComponent(text)}`;
}
