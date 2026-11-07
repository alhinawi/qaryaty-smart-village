// ─── Server notifications (order status updates, …)
import type { AppNotification } from '@/types';

/** The id prefix tells the store this one lives on the server. */
export const SERVER_NOTIF_PREFIX = 'srv_';

export interface NotificationsRepo {
  listMine(userId: string): Promise<AppNotification[]>;
  markRead(notifId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
