// ─── Render
export function Stats() {
  return (
    <section className="stats" aria-label="إحصائيات قريتي">
      <div className="stat-card">
        <div className="stat-num">+200</div>
        <div className="stat-label">مزود خدمة</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">15د</div>
        <div className="stat-label">متوسط التوصيل</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">4.9⭐</div>
        <div className="stat-label">تقييم التطبيق</div>
      </div>
    </section>
  );
}
