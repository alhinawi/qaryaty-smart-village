// ─── Job posts in Supabase (tables `jobs` and `job_reports`)
// RLS shows everyone the approved posts that haven't ended, and each person their
// own; the database trigger keeps the status and dates out of the app's hands.
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '../errors';
import { isRejectedByDatabase } from '../orders/supabaseOrderRepo';
import type { Job, JobDraft, JobRepo, JobStatus, JobType } from './types';

const COLUMNS =
  'id, owner_id, title, employer, village, job_type, hours, salary, description, contact_phone, contact_whatsapp, status, reject_reason, reports_count, expires_at, approved_at, created_at, updated_at';

const MESSAGES: Record<string, string> = {
  'jobs:too_many': 'نزّلت 5 إعلانات النهارده، جرّب بكرة.',
  'jobs:blocked': 'حسابك موقوف، ومش هنقدر ننشر الإعلان.',
  'jobs:too_early': 'تقدر تجدّد الإعلان في آخر 7 أيام من مدته.',
  'jobs:not_approved': 'الإعلان لسه مش منشور.',
  'jobs:not_found': 'الإعلان ده مش موجود.',
  'jobs:not_admin': 'دي للإدارة بس.',
};
const REJECTED_MESSAGE = 'الإعلان مااتحفظش، راجع البيانات وجرّب تاني';
const ALREADY_REPORTED = 'إنت بلّغت عن الإعلان ده قبل كده، وهنراجعه.';

export function jobErrorMessage(message: string | undefined): string {
  const key = Object.keys(MESSAGES).find((k) => message?.includes(k));
  return key ? MESSAGES[key] : REJECTED_MESSAGE;
}

export interface JobRow {
  id: string;
  owner_id: string;
  title: string;
  employer: string;
  village: string;
  job_type: JobType;
  hours: string | null;
  salary: string | null;
  description: string;
  contact_phone: string;
  contact_whatsapp: boolean;
  status: JobStatus;
  reject_reason: string | null;
  reports_count: number;
  expires_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    employer: row.employer,
    village: row.village,
    type: row.job_type,
    hours: row.hours ?? '',
    salary: row.salary ?? '',
    description: row.description,
    phone: row.contact_phone,
    whatsapp: row.contact_whatsapp,
    status: row.status,
    rejectReason: row.reject_reason ?? '',
    reportsCount: row.reports_count ?? 0,
    expiresAt: row.expires_at,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function draftToRow(draft: JobDraft) {
  return {
    title: draft.title.trim(),
    employer: draft.employer.trim(),
    village: draft.village.trim(),
    job_type: draft.type,
    hours: draft.hours.trim(),
    salary: draft.salary.trim(),
    description: draft.description.trim(),
    contact_phone: draft.phone,
    contact_whatsapp: draft.whatsapp,
  };
}

function check(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === '23505') throw new RepoError('rejected', ALREADY_REPORTED, { cause: error });
  if (isRejectedByDatabase(error.code) || error.message?.startsWith('jobs:')) {
    throw new RepoError('rejected', jobErrorMessage(error.message), { cause: error });
  }
  throw error;
}

export function createSupabaseJobRepo(getClient: () => Promise<SupabaseClient>): JobRepo {
  const one = async (query: PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>) => {
    const { data, error } = await query;
    check(error);
    if (!data) throw new RepoError('rejected', MESSAGES['jobs:not_found']);
    return rowToJob(data as JobRow);
  };

  return {
    async listPublic() {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('jobs')
        .select(COLUMNS)
        .eq('status', 'approved')
        .gt('expires_at', new Date().toISOString())
        .order('approved_at', { ascending: false })
        .limit(300);
      check(error);
      return ((data ?? []) as JobRow[]).map(rowToJob);
    },
    async get(id) {
      const supabase = await getClient();
      const { data, error } = await supabase.from('jobs').select(COLUMNS).eq('id', id).maybeSingle();
      if (error?.code === '22P02') return null; // not a uuid
      check(error);
      return data ? rowToJob(data as JobRow) : null;
    },
    async listMine(ownerId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('jobs')
        .select(COLUMNS)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      check(error);
      return ((data ?? []) as JobRow[]).map(rowToJob);
    },
    async create(_ownerId, draft) {
      const supabase = await getClient();
      return one(supabase.from('jobs').insert(draftToRow(draft)).select(COLUMNS).single());
    },
    async update(id, draft) {
      const supabase = await getClient();
      return one(supabase.from('jobs').update(draftToRow(draft)).eq('id', id).select(COLUMNS).single());
    },
    async close(id) {
      const supabase = await getClient();
      return one(supabase.from('jobs').update({ status: 'closed' }).eq('id', id).select(COLUMNS).single());
    },
    async reopen(id) {
      const supabase = await getClient();
      return one(supabase.from('jobs').update({ status: 'pending' }).eq('id', id).select(COLUMNS).single());
    },
    async renew(id) {
      const supabase = await getClient();
      return one(supabase.rpc('renew_job', { p_id: id }).single());
    },
    async remove(id) {
      const supabase = await getClient();
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      check(error);
    },
    async report(id, reason, note) {
      const supabase = await getClient();
      const { error } = await supabase.from('job_reports').insert({ job_id: id, reason, note: note.trim() });
      check(error);
    },
    async listForReview() {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('jobs')
        .select(COLUMNS)
        .eq('status', 'pending')
        .order('reports_count', { ascending: false })
        .order('created_at', { ascending: true });
      check(error);
      return ((data ?? []) as JobRow[]).map(rowToJob);
    },
    async review(id, approve, reason) {
      const supabase = await getClient();
      return one(
        supabase.rpc('admin_review_job', { p_id: id, p_approve: approve, p_reason: reason ?? null }).single()
      );
    },
  };
}
