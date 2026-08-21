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
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-extrabold text-green">
              لديك {unreadCount} إشعار جديد
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
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
                onClick={() => markAsRead(notif.id)}
              >
                <div className="text-[24px]">{notif.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <h5 className="text-sm font-extrabold">{notif.title}</h5>
                    <span className="text-[11px] text-text-muted">{notif.time}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-[1.4]">{notif.message}</p>
                </div>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-green absolute top-2.5 left-2.5" />}
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
