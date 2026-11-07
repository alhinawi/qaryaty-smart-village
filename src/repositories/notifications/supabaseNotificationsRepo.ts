// ─── Server notifications on Supabase (see the notifications migration)
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '@/repositories/errors';
import type { AppNotification } from '@/types';
import { SERVER_NOTIF_PREFIX, type NotificationsRepo } from './types';

interface Row {
  id: number;
  kind: string;
  title: string;
  body: string;
  icon: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

/** «منذ 5 دقائق» style, like the sample notifications. */
export function relativeTime(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'دلوقتي';
  if (mins === 1) return 'منذ دقيقة';
  if (mins === 2) return 'منذ دقيقتين';
  if (mins <= 10) return `منذ ${mins} دقائق`;
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return 'منذ ساعة';
  if (hours === 2) return 'منذ ساعتين';
  if (hours <= 10) return `منذ ${hours} ساعات`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'منبارح';
  if (days === 2) return 'منذ يومين';
  if (days <= 10) return `منذ ${days} أيام`;
  return `منذ ${days} يوم`;
}

function toApp(row: Row): AppNotification {
  return {
    id: `${SERVER_NOTIF_PREFIX}${row.id}`,
    title: row.title,
    message: row.body,
    time: relativeTime(row.created_at),
    read: row.read_at !== null,
    type: row.kind === 'order' ? 'order' : 'system',
    icon: row.icon,
    url: row.url ?? undefined,
  };
}

export function createSupabaseNotificationsRepo(getClient: () => Promise<SupabaseClient>): NotificationsRepo {
  return {
    async listMine(userId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('id, kind, title, body, icon, url, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب الإشعارات', { cause: error });
      return (data as Row[]).map(toApp);
    },

    async markRead(notifId) {
      const supabase = await getClient();
      const id = Number(notifId.slice(SERVER_NOTIF_PREFIX.length));
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .is('read_at', null);
      if (error) throw new RepoError('unavailable', 'ماقدرناش نحدّث الإشعار', { cause: error });
    },

    async markAllRead(userId) {
      const supabase = await getClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw new RepoError('unavailable', 'ماقدرناش نحدّث الإشعارات', { cause: error });
    },
  };
}
