// ─── Imports
import type { OrderModalData } from '@/types';

// ─── Types
interface BottomNavProps {
  onOpenModal: (service: OrderModalData) => void;
  onShowToast: (message: string) => void;
}

// ─── Render
export function BottomNav({ onOpenModal, onShowToast }: BottomNavProps) {
  const handleOrdersClick = () => {
    onShowToast('📋 قيد التطوير!');
  };

  const handleFabClick = () => {
    onOpenModal({
      emoji: '🚀',
      name: 'اطلب خدمة',
      desc: 'اختار الخدمة اللي محتاجها',
    });
  };

  const handleMessagesClick = () => {
    onShowToast('💬 قيد التطوير!');
  };

  const handleAccountClick = () => {
    onShowToast('👤 قيد التطوير!');
  };

  return (
    <nav className="bottom-nav" aria-label="التنقل السفلي">
      {/* Home */}
      <button
        type="button"
        className="nav-item active"
        aria-label="الرئيسية"
      >
        <span className="nav-icon" role="img" aria-hidden="true">🏠</span>
        <span className="nav-label">الرئيسية</span>
      </button>

      {/* Orders */}
      <button
        type="button"
        className="nav-item"
        onClick={handleOrdersClick}
        aria-label="طلباتي"
      >
        <span className="nav-icon" role="img" aria-hidden="true">📋</span>
        <span className="nav-label">طلباتي</span>
      </button>

      {/* Add / FAB */}
      <button
        type="button"
        className="nav-item"
        onClick={handleFabClick}
        aria-label="طلب خدمة جديدة"
      >
        <div className="nav-fab" aria-hidden="true">+</div>
      </button>

      {/* Messages */}
      <button
        type="button"
        className="nav-item"
        onClick={handleMessagesClick}
        aria-label="الرسائل"
      >
        <span className="nav-icon" role="img" aria-hidden="true">💬</span>
        <span className="nav-label">رسائل</span>
      </button>

      {/* Account */}
      <button
        type="button"
        className="nav-item"
        onClick={handleAccountClick}
        aria-label="حسابي"
      >
        <span className="nav-icon" role="img" aria-hidden="true">👤</span>
        <span className="nav-label">حسابي</span>
      </button>
    </nav>
  );
}
