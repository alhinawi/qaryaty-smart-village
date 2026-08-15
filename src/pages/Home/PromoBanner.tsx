// ─── Imports
import { useUIStore } from '@/stores/useUIStore';

// ─── Component
export function PromoBanner() {
  const showToast = useUIStore((state) => state.showToast);

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('QARYA1').catch(() => {});
    }
    showToast('🎉 تم نسخ كود الخصم: QARYA1 (خصم 100% على أول طلب!)');
  };

  return (
    <section className="promo" aria-label="عرض ترويجي">
      <div className="promo-text">
        <h4>🎉 أول طلب مجاني بالكامل!</h4>
        <p>استخدم كود الخصم عند الدفع واحصل على أول خدمة وتوصيل مجاناً</p>
      </div>
      <button
        type="button"
        className="promo-code"
        onClick={handleCopyCode}
        aria-label="نسخ كود الخصم QARYA1"
      >
        QARYA1
      </button>
    </section>
  );
}
