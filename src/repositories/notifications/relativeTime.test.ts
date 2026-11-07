import { describe, expect, it } from 'vitest';
import { relativeTime } from './supabaseNotificationsRepo';

const NOW = new Date('2026-11-07T12:00:00Z').getTime();
const ago = (mins: number) => new Date(NOW - mins * 60000).toISOString();

describe('relativeTime', () => {
  it('covers the Arabic ranges', () => {
    expect(relativeTime(ago(0), NOW)).toBe('دلوقتي');
    expect(relativeTime(ago(1), NOW)).toBe('منذ دقيقة');
    expect(relativeTime(ago(2), NOW)).toBe('منذ دقيقتين');
    expect(relativeTime(ago(5), NOW)).toBe('منذ 5 دقائق');
    expect(relativeTime(ago(45), NOW)).toBe('منذ 45 دقيقة');
    expect(relativeTime(ago(60), NOW)).toBe('منذ ساعة');
    expect(relativeTime(ago(120), NOW)).toBe('منذ ساعتين');
    expect(relativeTime(ago(5 * 60), NOW)).toBe('منذ 5 ساعات');
    expect(relativeTime(ago(23 * 60), NOW)).toBe('منذ 23 ساعة');
    expect(relativeTime(ago(24 * 60), NOW)).toBe('منبارح');
    expect(relativeTime(ago(48 * 60), NOW)).toBe('منذ يومين');
    expect(relativeTime(ago(5 * 24 * 60), NOW)).toBe('منذ 5 أيام');
    expect(relativeTime(ago(30 * 24 * 60), NOW)).toBe('منذ 30 يوم');
  });
});
