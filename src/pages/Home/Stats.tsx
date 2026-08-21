// ─── Component
export function Stats() {
  return (
    <section className="grid grid-cols-3 gap-2.5 mb-6 md:grid-cols-4 md:gap-4" aria-label="إحصائيات قريتي">
      <div className="bg-white rounded-2xl px-2.5 py-3.5 text-center shadow-card border border-[rgba(26,122,74,0.08)] transition-transform duration-200 hover:translate-y-[-2px]">
        <div className="text-[clamp(1.25rem,3vw,1.625rem)] font-black text-green font-['Tajawal',sans-serif]">+200</div>
        <div className="text-xs text-text-muted mt-1 font-bold">مزود خدمة محلي</div>
      </div>
      <div className="bg-white rounded-2xl px-2.5 py-3.5 text-center shadow-card border border-[rgba(26,122,74,0.08)] transition-transform duration-200 hover:translate-y-[-2px]">
        <div className="text-[clamp(1.25rem,3vw,1.625rem)] font-black text-green font-['Tajawal',sans-serif]">15د</div>
        <div className="text-xs text-text-muted mt-1 font-bold">متوسط التوصيل</div>
      </div>
      <div className="bg-white rounded-2xl px-2.5 py-3.5 text-center shadow-card border border-[rgba(26,122,74,0.08)] transition-transform duration-200 hover:translate-y-[-2px]">
        <div className="text-[clamp(1.25rem,3vw,1.625rem)] font-black text-green font-['Tajawal',sans-serif]">4.9⭐</div>
        <div className="text-xs text-text-muted mt-1 font-bold">تقييم التطبيق</div>
      </div>
      <div className="bg-white rounded-2xl px-2.5 py-3.5 text-center shadow-card border border-[rgba(26,122,74,0.08)] transition-transform duration-200 hover:translate-y-[-2px] hidden md:block">
        <div className="text-[clamp(1.25rem,3vw,1.625rem)] font-black text-green font-['Tajawal',sans-serif]">100%</div>
        <div className="text-xs text-text-muted mt-1 font-bold">ضمان الجودة</div>
      </div>
    </section>
  );
}
