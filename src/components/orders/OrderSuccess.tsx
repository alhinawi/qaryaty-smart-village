// ─── Imports
import { useEffect } from 'react';

// ─── Types
interface OrderSuccessProps {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
}

// ─── Render
export function OrderSuccess({
  isOpen,
  orderNumber,
  onClose,
}: OrderSuccessProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="success-screen open"
      id="successScreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="successTitle"
    >
      <div className="success-check" role="img" aria-label="نجاح">
        ✅
      </div>
      <h2 id="successTitle">تم تأكيد طلبك!</h2>
      <p>جاري إيجاد أقرب مزود خدمة ليك</p>

      {/* Order Number Box */}
      <div className="order-id">
        <span>رقم الطلب</span>
        <strong>{orderNumber}</strong>
      </div>

      {/* 4-Step Order Tracker */}
      <div className="tracking-bar" aria-label="مراحل تتبع الطلب">
        <div className="track-step">
          <div className="track-dot done">✓</div>
          <span>تم استلام الطلب</span>
        </div>
        <div className="track-step">
          <div className="track-dot done">🔍</div>
          <span>جاري إيجاد مزود قريب</span>
        </div>
        <div className="track-step">
          <div className="track-dot pending">🚗</div>
          <span>في الطريق إليك</span>
        </div>
        <div className="track-step">
          <div className="track-dot pending">🏠</div>
          <span>تم التسليم</span>
        </div>
      </div>

      {/* Back Button */}
      <button
        type="button"
        className="btn-back"
        onClick={onClose}
      >
        🏠 الرئيسية
      </button>
    </div>
  );
}
