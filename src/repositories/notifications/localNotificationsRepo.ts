// ─── Demo mode: server notifications live on this device
import type { AppNotification } from '@/types';
import { SERVER_NOTIF_PREFIX, type NotificationsRepo } from './types';

const KEY = 'qaryati_mock_notifications';

function load(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as AppNotification[];
  } catch {
    return [];
  }
}

function save(list: AppNotification[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode */
  }
}

export function createLocalNotificationsRepo(): NotificationsRepo {
  return {
    async listMine() {
      return load().filter((n) => n.id.startsWith(SERVER_NOTIF_PREFIX));
    },
    async markRead(notifId) {
      save(load().map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    },
    async markAllRead() {
      save(load().map((n) => ({ ...n, read: true })));
    },
  };
}
