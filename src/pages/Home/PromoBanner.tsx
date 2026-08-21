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
    <section className="mb-6 bg-[linear-gradient(135deg,#92400e,#b45309)] rounded-2xl p-5 flex items-center justify-between text-white relative overflow-hidden" aria-label="عرض ترويجي">
      <div className="promo-text">
        <h4 className="text-[clamp(1rem,2.5vw,1.25rem)] font-black mb-1">🎉 أول طلب مجاني بالكامل!</h4>
        <p className="text-[13px] opacity-90">استخدم كود الخصم عند الدفع واحصل على أول خدمة وتوصيل مجاناً</p>
      </div>
      <button
        type="button"
        className="bg-gold text-black font-black text-[15px] px-4 py-2 rounded-xl shrink-0 border-none cursor-pointer font-['Cairo',sans-serif] shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:bg-gold-light hover:scale-105"
        onClick={handleCopyCode}
        aria-label="نسخ كود الخصم QARYA1"
      >
        QARYA1
      </button>
    </section>
  );
}
