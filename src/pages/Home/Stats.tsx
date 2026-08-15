// ─── Component
export function Stats() {
  return (
    <section className="stats-section" aria-label="إحصائيات قريتي">
      <div className="stat-card">
        <div className="stat-num">+200</div>
        <div className="stat-label">مزود خدمة محلي</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">15د</div>
        <div className="stat-label">متوسط التوصيل</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">4.9⭐</div>
        <div className="stat-label">تقييم التطبيق</div>
      </div>
      <div className="stat-card desktop-only-stat">
        <div className="stat-num">100%</div>
        <div className="stat-label">ضمان الجودة</div>
      </div>
    </section>
  );
}
