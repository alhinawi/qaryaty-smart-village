import { beforeEach, describe, expect, it } from 'vitest';
import { createMockJobRepo } from './mockJobRepo';
import { draftToRow, jobErrorMessage, rowToJob, type JobRow } from './supabaseJobRepo';
import type { JobDraft } from './types';

const draft: JobDraft = {
  title: 'سواق توك توك',
  employer: 'الحاج سعيد',
  village: 'بدواي',
  type: 'daily',
  hours: ' من 6 الصبح ',
  salary: '',
  description: 'محتاجين سواق برخصة لمدة أسبوع',
  phone: '01112345678',
  whatsapp: false,
};

describe('supabase job repo', () => {
  it('maps the form to the columns the table allows', () => {
    expect(draftToRow(draft)).toEqual({
      title: 'سواق توك توك',
      employer: 'الحاج سعيد',
      village: 'بدواي',
      job_type: 'daily',
      hours: 'من 6 الصبح',
      salary: '',
      description: 'محتاجين سواق برخصة لمدة أسبوع',
      contact_phone: '01112345678',
      contact_whatsapp: false,
    });
  });

  it('reads a row back into a job', () => {
    const row = {
      ...draftToRow(draft),
      id: 'j1',
      owner_id: 'u1',
      hours: null,
      salary: null,
      status: 'approved',
      reject_reason: null,
      reports_count: 2,
      expires_at: '2026-12-06T00:00:00Z',
      approved_at: '2026-11-06T00:00:00Z',
      created_at: '2026-11-06T00:00:00Z',
      updated_at: '2026-11-06T00:00:00Z',
    } as JobRow;
    const job = rowToJob(row);
    expect(job).toMatchObject({ id: 'j1', ownerId: 'u1', type: 'daily', phone: '01112345678', hours: '', salary: '', rejectReason: '', reportsCount: 2 });
  });

  it("turns the database's limits into messages people understand", () => {
    expect(jobErrorMessage('jobs:too_many')).toContain('5 إعلانات');
    expect(jobErrorMessage('jobs:too_early')).toContain('7 أيام');
    expect(jobErrorMessage('something else')).toContain('مااتحفظش');
  });
});

describe('demo job repo', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } as Storage;
  });

  it('keeps a new post out of the list until it is approved, then shows it for 30 days', async () => {
    const repo = createMockJobRepo();
    const before = (await repo.listPublic()).length;
    const posted = await repo.create('me', draft);
    expect(posted.status).toBe('pending');
    expect((await repo.listPublic()).length).toBe(before);
    expect((await repo.listForReview()).map((j) => j.id)).toContain(posted.id);

    const approved = await repo.review(posted.id, true);
    const days = (new Date(approved.expiresAt!).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBe(30);
    expect((await repo.listPublic())[0].id).toBe(posted.id);
  });

  it('sends an edited post back to review and hides a closed one', async () => {
    const repo = createMockJobRepo();
    const posted = await repo.create('me', draft);
    await repo.review(posted.id, true);
    const edited = await repo.update(posted.id, { ...draft, salary: '250 في اليوم' });
    expect(edited.status).toBe('pending');
    await repo.review(posted.id, true);
    await repo.close(posted.id);
    expect((await repo.listPublic()).some((j) => j.id === posted.id)).toBe(false);
    expect((await repo.listMine('me'))[0].status).toBe('closed');
  });

  it('only renews in the last 7 days', async () => {
    const repo = createMockJobRepo();
    const posted = await repo.create('me', draft);
    await repo.review(posted.id, true);
    await expect(repo.renew(posted.id)).rejects.toThrow('7 أيام');
  });

  it('hides a post again after three reports', async () => {
    const repo = createMockJobRepo();
    const posted = await repo.create('me', draft);
    await repo.review(posted.id, true);
    for (let i = 0; i < 3; i++) await repo.report(posted.id, 'asks_money', '');
    expect((await repo.get(posted.id))?.status).toBe('pending');
  });
});
