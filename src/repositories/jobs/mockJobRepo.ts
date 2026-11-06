// ─── Demo mode: job posts stay on this device, with the same rules as the database
import { JOB_DAYS, JOB_RENEW_WINDOW_DAYS, isLive } from '@/config/jobs';
import { RepoError } from '../errors';
import type { Job, JobDraft, JobRepo } from './types';

const KEY = 'qaryati_jobs';
const DAY = 24 * 60 * 60 * 1000;

function sample(id: string, draft: JobDraft, daysAgo: number): Job {
  const approved = new Date(Date.now() - daysAgo * DAY);
  return {
    ...draft,
    id,
    ownerId: 'demo_owner',
    status: 'approved',
    rejectReason: '',
    reportsCount: 0,
    approvedAt: approved.toISOString(),
    expiresAt: new Date(approved.getTime() + JOB_DAYS * DAY).toISOString(),
    createdAt: approved.toISOString(),
    updatedAt: approved.toISOString(),
  };
}

const SAMPLES: Job[] = [
  sample(
    'demo_job_1',
    {
      title: 'بائع في سوبر ماركت',
      employer: 'سوبر ماركت البركة',
      village: 'منية سندوب',
      type: 'full_time',
      hours: 'من 9 الصبح لـ 5 العصر',
      salary: '4000 جنيه في الشهر',
      description: 'محتاجين شاب من القرية يرتب الرفوف ويقف على الكاشير. مش لازم خبرة.',
      phone: '01012345678',
      whatsapp: true,
    },
    1
  ),
  sample(
    'demo_job_2',
    {
      title: 'عمال في جمع البرتقان',
      employer: 'الحاج سعيد',
      village: 'بدواي',
      type: 'daily',
      hours: 'من 6 الصبح للضهر',
      salary: '200 جنيه في اليوم',
      description: 'جمع برتقان لمدة أسبوعين، والفلوس آخر كل يوم.',
      phone: '01112345678',
      whatsapp: false,
    },
    3
  ),
];

function load(): Job[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Job[]) : [...SAMPLES];
  } catch {
    return [...SAMPLES];
  }
}

function save(jobs: Job[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs));
  } catch {
    // Storage full or blocked: changes last until reload
  }
}

const newest = (a: Job, b: Job) => b.createdAt.localeCompare(a.createdAt);

export function createMockJobRepo(): JobRepo {
  const change = (id: string, fn: (job: Job) => Job): Job => {
    const jobs = load();
    const i = jobs.findIndex((j) => j.id === id);
    if (i < 0) throw new RepoError('rejected', 'الإعلان ده مش موجود.');
    jobs[i] = { ...fn(jobs[i]), updatedAt: new Date().toISOString() };
    save(jobs);
    return jobs[i];
  };

  return {
    async listPublic() {
      return load()
        .filter((j) => isLive(j))
        .sort((a, b) => (b.approvedAt ?? '').localeCompare(a.approvedAt ?? ''));
    },
    async get(id) {
      return load().find((j) => j.id === id) ?? null;
    },
    async listMine(ownerId) {
      return load().filter((j) => j.ownerId === ownerId).sort(newest);
    },
    async create(ownerId, draft) {
      const now = new Date().toISOString();
      const job: Job = {
        ...draft,
        id: crypto.randomUUID(),
        ownerId,
        status: 'pending',
        rejectReason: '',
        reportsCount: 0,
        expiresAt: null,
        approvedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      save([job, ...load()]);
      return job;
    },
    async update(id, draft) {
      return change(id, (job) => ({ ...job, ...draft, status: 'pending', rejectReason: '' }));
    },
    async close(id) {
      return change(id, (job) => ({ ...job, status: 'closed' }));
    },
    async reopen(id) {
      return change(id, (job) => ({ ...job, status: 'pending' }));
    },
    async renew(id) {
      return change(id, (job) => {
        if (job.status !== 'approved') throw new RepoError('rejected', 'الإعلان لسه مش منشور.');
        if (job.expiresAt && new Date(job.expiresAt).getTime() - Date.now() > JOB_RENEW_WINDOW_DAYS * DAY) {
          throw new RepoError('rejected', 'تقدر تجدّد الإعلان في آخر 7 أيام من مدته.');
        }
        return { ...job, expiresAt: new Date(Date.now() + JOB_DAYS * DAY).toISOString() };
      });
    },
    async remove(id) {
      save(load().filter((j) => j.id !== id));
    },
    async report(id) {
      change(id, (job) => {
        const reportsCount = job.reportsCount + 1;
        return { ...job, reportsCount, status: reportsCount >= 3 ? 'pending' : job.status };
      });
    },
    async listForReview() {
      return load()
        .filter((j) => j.status === 'pending')
        .sort((a, b) => b.reportsCount - a.reportsCount || a.createdAt.localeCompare(b.createdAt));
    },
    async review(id, approve, reason) {
      return change(id, (job) =>
        approve
          ? {
              ...job,
              status: 'approved',
              rejectReason: '',
              reportsCount: 0,
              approvedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + JOB_DAYS * DAY).toISOString(),
            }
          : { ...job, status: 'rejected', rejectReason: reason?.trim() ?? '' }
      );
    },
  };
}
