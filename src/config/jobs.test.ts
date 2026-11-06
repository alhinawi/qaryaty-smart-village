import { describe, expect, it } from 'vitest';
import { canRenew, daysLeft, filterJobs, isLive, jobVillages, jobWhatsappLink, ownerStatusLabel, postedAgo, shortVillage } from './jobs';
import type { Job } from '@/repositories/jobs/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-11-06T12:00:00Z').getTime();
const inDays = (d: number) => new Date(NOW + d * DAY).toISOString();

function job(over: Partial<Job> = {}): Job {
  return {
    id: 'j1',
    ownerId: 'u1',
    title: 'بائع في سوبر ماركت',
    employer: 'سوبر ماركت البركة',
    village: 'منية سندوب',
    type: 'full_time',
    hours: '',
    salary: '',
    description: 'محتاجين شاب يقف على الكاشير',
    phone: '01012345678',
    whatsapp: true,
    status: 'approved',
    rejectReason: '',
    reportsCount: 0,
    expiresAt: inDays(20),
    approvedAt: inDays(-10),
    createdAt: inDays(-10),
    updatedAt: inDays(-10),
    ...over,
  };
}

describe('job posts', () => {
  it('shows only approved posts that have not ended', () => {
    expect(isLive(job(), NOW)).toBe(true);
    expect(isLive(job({ expiresAt: inDays(-1) }), NOW)).toBe(false);
    expect(isLive(job({ status: 'pending', expiresAt: null }), NOW)).toBe(false);
    expect(isLive(job({ status: 'closed' }), NOW)).toBe(false);
  });

  it('counts the days left and opens renew in the last 7 days', () => {
    expect(daysLeft(job(), NOW)).toBe(20);
    expect(daysLeft(job({ expiresAt: null }), NOW)).toBeNull();
    expect(canRenew(job(), NOW)).toBe(false);
    expect(canRenew(job({ expiresAt: inDays(6) }), NOW)).toBe(true);
    expect(canRenew(job({ expiresAt: inDays(-3) }), NOW)).toBe(true);
    expect(canRenew(job({ status: 'rejected', expiresAt: inDays(2) }), NOW)).toBe(false);
  });

  it('tells the owner when an approved post has ended', () => {
    expect(ownerStatusLabel(job({ expiresAt: inDays(-1) }), NOW)).toBe('خلصت مدته');
    expect(ownerStatusLabel(job(), NOW)).toBe('منشور');
    expect(ownerStatusLabel(job({ status: 'pending' }), NOW)).toBe('مستني المراجعة');
  });

  it('filters by village, type and an Arabic search that ignores hamza and taa marbuta', () => {
    const list = [
      job(),
      job({ id: 'j2', title: 'سواق توك توك', village: 'بدواي', type: 'daily' }),
      job({ id: 'j3', title: 'مدرسة إنجليزي', type: 'part_time' }),
    ];
    expect(filterJobs(list, { query: '', village: 'بدواي', type: '' }).map((j) => j.id)).toEqual(['j2']);
    expect(filterJobs(list, { query: '', village: '', type: 'part_time' }).map((j) => j.id)).toEqual(['j3']);
    expect(filterJobs(list, { query: 'مدرسه انجليزي', village: '', type: '' }).map((j) => j.id)).toEqual(['j3']);
    expect(filterJobs(list, { query: 'باليومية', village: '', type: '' }).map((j) => j.id)).toEqual(['j2']);
  });

  it('shortens a village label for the cards', () => {
    expect(shortVillage('منية سندوب، مركز المنصورة - الدقهلية')).toBe('منية سندوب');
    expect(shortVillage('بدواي')).toBe('بدواي');
  });

  it('lists the villages that have posts, most first', () => {
    expect(jobVillages([job(), job({ village: 'بدواي' }), job()])).toEqual(['منية سندوب', 'بدواي']);
  });

  it('says how old a post is in Egyptian Arabic', () => {
    expect(postedAgo(inDays(0), NOW)).toBe('النهارده');
    expect(postedAgo(inDays(-1), NOW)).toBe('امبارح');
    expect(postedAgo(inDays(-5), NOW)).toBe('من 5 أيام');
  });

  it('opens WhatsApp on the Egyptian number with a first message', () => {
    const link = jobWhatsappLink(job());
    expect(link.startsWith('https://wa.me/201012345678?text=')).toBe(true);
    expect(decodeURIComponent(link)).toContain('بائع في سوبر ماركت');
  });
});
