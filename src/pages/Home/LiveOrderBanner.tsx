// ─── Imports
import { useUIStore } from '@/stores/useUIStore';
import { useGoToTab } from '@/hooks/useTabNavigation';

// ─── Demo card: the order's display name stays in one place so the title and
// the tracking toast never drift apart.
const ORDER_NAME = 'حامد العيش';

// ─── Component
export function LiveOrderBanner() {
  const setActiveTab = useGoToTab();
  const showToast = useUIStore((state) => state.showToast);

  const handleTrackClick = () => {
    showToast(`📍 جاري تتبع طلب ${ORDER_NAME}...`);
    setActiveTab('orders');
  };

  return (
    <div className="mb-6 bg-white rounded-2xl px-4 py-3.5 shadow-md flex items-center gap-3.5 border border-red-500/12" aria-label="تنبيه طلب مباشر">
      <div className="text-[32px] shrink-0" role="img" aria-label="مندوب توصيل">
        🛵
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-extrabold text-text">استلم {ORDER_NAME} وفي الطريق ليك</span>
          <span className="inline-flex items-center gap-1 bg-danger text-white text-[11px] font-extrabold px-2 py-0.5 rounded-xl animate-pulse qaryati-live-badge">
            <span className="w-1.5 h-1.5 rounded-sm bg-white animate-pulse qaryati-live-badge" /> مباشر
          </span>
        </div>
        <div className="text-xs text-text-muted">⏱️ متوقع وصوله في 8 دقايق</div>
      </div>
      <button
        type="button"
        className="bg-green text-white border-none rounded-xl px-3.5 py-1.5 text-[13px] cursor-pointer font-['Cairo',sans-serif] font-extrabold shrink-0 transition-all duration-200 hover:bg-green-light hover:scale-105"
        onClick={handleTrackClick}
        aria-label="تتبع الطلب المباشر"
      >
        تتبع
      </button>
    </div>
  );
}
