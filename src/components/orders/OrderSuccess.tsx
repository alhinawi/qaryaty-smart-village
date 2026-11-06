// ─── Imports
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';

// ─── Types
interface OrderSuccessProps {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
  onViewOrders: () => void;
}

// ─── Component
export function OrderSuccess({
  isOpen,
  orderNumber,
  onClose,
  onViewOrders,
}: OrderSuccessProps) {
  // Android/browser back closes this screen instead of leaving the page
  useBackButtonClose(isOpen, onClose);

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
      className="fixed inset-0 z-300 bg-linear-to-br from-green-dark to-green flex flex-col items-center justify-center text-white text-center p-8 min-h-svh"
      id="successScreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="successTitle"
    >
      <div className="text-[72px] mb-4 animate-[splashPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]" role="img" aria-label="نجاح">
        ✅
      </div>
      <h2 id="successTitle" className="text-[clamp(1.5rem,4vw,2rem)] font-black mb-2 font-['Tajawal',sans-serif]">طلبك اتأكد!</h2>
      <p className="text-base opacity-90 mb-6">بندور على أقرب حد يقدملك الخدمة في القرية</p>

      {/* Order Number Box */}
      <div className="bg-white/15 rounded-2xl py-4 px-8 mb-6">
        <span className="text-xs opacity-80 block">رقم الطلب</span>
        <strong className="text-[1.75rem] font-black tracking-[3px] [direction:ltr] inline-block">{orderNumber}</strong>
      </div>

      {/* 4-Step Order Tracker */}
      <div className="bg-white/10 rounded-2xl p-4 w-full max-w-[340px] mb-6 text-right" aria-label="مراحل تتبع الطلب">
        <div className="flex items-center gap-2.5 py-2 text-sm">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 bg-gold text-black">✓</div>
          <span>الطلب وصلنا</span>
        </div>
        <div className="flex items-center gap-2.5 py-2 text-sm">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 bg-gold text-black">🔍</div>
          <span>بندور على حد قريب</span>
        </div>
        <div className="flex items-center gap-2.5 py-2 text-sm">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 bg-white/20">🚗</div>
          <span>في الطريق إليك</span>
        </div>
        <div className="flex items-center gap-2.5 py-2 text-sm">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 bg-white/20">🏠</div>
          <span>اتسلّم</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-[300px]">
        <Button variant="gold" size="lg" onClick={onViewOrders}>
          📋 تتبع الطلب في طلباتي
        </Button>
        <button
          type="button"
          className="bg-transparent border border-white/40 text-white p-3 rounded-xl font-['Cairo',sans-serif] text-sm font-bold cursor-pointer"
          onClick={onClose}
        >
          🏠 العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
