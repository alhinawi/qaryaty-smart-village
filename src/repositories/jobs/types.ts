// ─── وظائف: job posts (table `jobs`, see supabase/migrations/20261106170000_jobs.sql)

export type JobType = 'full_time' | 'part_time' | 'daily';
export type JobStatus = 'pending' | 'approved' | 'rejected' | 'closed';
export type JobReportReason = 'scam' | 'fake' | 'asks_money' | 'other';

/** What the poster fills in */
export interface JobDraft {
  title: string;
  employer: string;
  village: string;
  type: JobType;
  hours: string;
  salary: string;
  description: string;
  /** 01xxxxxxxxx, for calls */
  phone: string;
  /** Show a WhatsApp button on the same number */
  whatsapp: boolean;
}

export interface Job extends JobDraft {
  id: string;
  ownerId: string;
  status: JobStatus;
  rejectReason: string;
  reportsCount: number;
  /** Set when an admin approves; the post hides after it */
  expiresAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobRepo {
  /** Approved posts that haven't ended, newest first */
  listPublic(): Promise<Job[]>;
  /** One post: anyone for a live post, the owner or an admin for the rest. null when hidden. */
  get(id: string): Promise<Job | null>;
  /** The signed-in person's own posts, every status */
  listMine(ownerId: string): Promise<Job[]>;
  create(ownerId: string, draft: JobDraft): Promise<Job>;
  /** An edit sends the post back to review */
  update(id: string, draft: JobDraft): Promise<Job>;
  close(id: string): Promise<Job>;
  /** Sends a closed post back to review */
  reopen(id: string): Promise<Job>;
  /** 30 more days, from 7 days before it ends */
  renew(id: string): Promise<Job>;
  remove(id: string): Promise<void>;
  report(id: string, reason: JobReportReason, note: string): Promise<void>;
  // Admin
  listForReview(): Promise<Job[]>;
  review(id: string, approve: boolean, reason?: string): Promise<Job>;
}
