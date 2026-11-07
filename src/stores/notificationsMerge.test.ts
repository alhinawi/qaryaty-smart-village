import { describe, expect, it } from 'vitest';
import { mergeNotifications, withoutSampleNotifications } from './useUIStore';
import type { AppNotification } from '@/types';

const sample = (id: string): AppNotification => ({ id, title: id, message: '', time: '', read: false, type: 'system', icon: '' });

describe('mergeNotifications', () => {
  it('keeps every sample while no real ones exist', () => {
    const local = [sample('notif_1'), sample('notif_2'), sample('notif_3')];
    expect(mergeNotifications([], local)).toEqual(local);
  });

  it('every real notification replaces one sample, real ones first', () => {
    const local = [sample('notif_1'), sample('notif_2'), sample('notif_3')];
    const merged = mergeNotifications([sample('srv_1'), sample('srv_2')], local);
    expect(merged.map((n) => n.id)).toEqual(['srv_1', 'srv_2', 'notif_3']);
  });

  it('all real once they outnumber the samples', () => {
    const merged = mergeNotifications([sample('srv_1'), sample('srv_2')], [sample('notif_1')]);
    expect(merged.map((n) => n.id)).toEqual(['srv_1', 'srv_2']);
  });
});

describe('withoutSampleNotifications (real mode hides the seeded samples)', () => {
  it('drops the seeded samples when demo is off, keeps server and runtime ones', () => {
    const list = [sample('srv_1'), sample('notif_1'), sample('notif_2'), sample('notif_1700000000000')];
    expect(withoutSampleNotifications(list, false).map((n) => n.id)).toEqual(['srv_1', 'notif_1700000000000']);
  });

  it('keeps everything in demo mode', () => {
    const list = [sample('srv_1'), sample('notif_1')];
    expect(withoutSampleNotifications(list, true)).toEqual(list);
  });
});
