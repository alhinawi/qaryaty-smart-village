// ─── Imports
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { mergeNotifications, withoutSampleNotifications, useUIStore } from '@/stores/useUIStore';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { notificationsRepo, SERVER_NOTIF_PREFIX } from '@/repositories';

// ─── Component
export function NotificationsDrawer() {
  const isOpen = useUIStore((state) => state.isNotificationsOpen);
  const setIsOpen = useUIStore((state) => state.setIsNotificationsOpen);
  const remoteNotifs = useUIStore((state) => state.remoteNotifications);
  const localNotifs = useUIStore((state) => state.notifications);
  const demoOn = useTrackingDemoMode();
  const notifications = useMemo(
    () => withoutSampleNotifications(mergeNotifications(remoteNotifs, localNotifs), demoOn),
    [remoteNotifs, localNotifs, demoOn]
  );
  const setRemoteNotifications = useUIStore((state) => state.setRemoteNotifications);
  const markAsRead = useUIStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useUIStore((state) => state.markAllNotificationsAsRead);
  const user = useAuthStore(selectUser);
  const userId = user?.id;

  // Opening the drawer refreshes the real notifications for a signed-in account
  useEffect(() => {
    if (!isOpen || !userId) return;
    let alive = true;
    notificationsRepo
      .listMine(userId)
      .then((list) => {
        if (alive) setRemoteNotifications(list);
      })
      .catch(() => {
        /* keep whatever is already shown */
      });
    return () => {
      alive = false;
    };
  }, [isOpen, userId, setRemoteNotifications]);

  const navigate = useNavigate();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    if (id.startsWith(SERVER_NOTIF_PREFIX)) {
      notificationsRepo.markRead(id).catch(() => {});
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    if (user) notificationsRepo.markAllRead(user.id).catch(() => {});
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      emoji="🔔"
      title="مركز الإشعارات"
      maxWidth="500px"
    >
      <div className="notifications-drawer-content">
        {/* Header Actions */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-extrabold text-green">
              لديك {unreadCount} إشعار جديد
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              تحديد الكل كمقروء ✓
            </Button>
          </div>
        )}

        {/* List or Empty State */}
        {notifications.length === 0 ? (
          <EmptyState
            emoji="🔕"
            title="مفيش إشعارات!"
            description="لا توجد أي إشعارات جديدة في حسابك الآن."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer relative transition-colors duration-150 ${notif.read ? 'bg-gray-50 border-gray-100' : 'bg-green-50 border-green/20'}`}
                onClick={() => {
                  handleMarkAsRead(notif.id);
                  if (notif.url) {
                    setIsOpen(false);
                    navigate(notif.url);
                  }
                }}
              >
                <div className="text-[24px]">{notif.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <h5 className="text-sm font-extrabold">{notif.title}</h5>
                    <span className="text-[11px] text-text-muted">{notif.time}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-[1.4]">{notif.message}</p>
                </div>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-green absolute top-1 left-1.5" />}
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="md"
          className="w-full mt-4"
          onClick={() => setIsOpen(false)}
        >
          إغلاق
        </Button>
      </div>
    </Modal>
  );
}
