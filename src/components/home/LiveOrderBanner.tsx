// ─── Types
interface LiveOrderBannerProps {
  onShowToast: (message: string) => void;
}

// ─── Render
export function LiveOrderBanner({ onShowToast }: LiveOrderBannerProps) {
  const handleTrackClick = () => {
    onShowToast('📍 جاري تتبع الطلب...');
  };

  return (
    <div className="live-order-banner" aria-label="تنبيه طلب مباشر">
      <div className="live-order-icon" role="img" aria-label="مندوب توصيل">
        🛵
      </div>
      <div className="live-order-info">
        <div className="live-order-header">
          <span className="live-order-title">طلب حامد العيش شغال دلوقتي</span>
          <span className="live-badge">
            <span className="live-dot" /> مباشر
          </span>
        </div>
        <div className="live-order-eta">⏱️ متوقع وصوله في 8 دقايق</div>
      </div>
      <button
        type="button"
        className="live-order-btn"
        onClick={handleTrackClick}
      >
        تتبع
      </button>
    </div>
  );
}
