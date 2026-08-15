// ─── Imports
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUIStore } from '@/stores/useUIStore';

// ─── Component
export function NotificationsDrawer() {
  const isOpen = useUIStore((state) => state.isNotificationsOpen);
  const setIsOpen = useUIStore((state) => state.setIsNotificationsOpen);
  const notifications = useUIStore((state) => state.notifications);
  const markAsRead = useUIStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useUIStore((state) => state.markAllNotificationsAsRead);

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
          <div className="notifications-top-bar">
            <span className="unread-badge-text">
              لديك {unreadCount} إشعار جديد
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="mark-read-btn"
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
          <div className="notifications-list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification-card ${notif.read ? 'read' : 'unread'}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="notif-icon-box">{notif.icon}</div>
                <div className="notif-body">
                  <div className="notif-header-row">
                    <h5 className="notif-title">{notif.title}</h5>
                    <span className="notif-time">{notif.time}</span>
                  </div>
                  <p className="notif-msg">{notif.message}</p>
                </div>
                {!notif.read && <span className="notif-unread-dot" />}
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
