// ─── Types
interface PromoBannerProps {
  onShowToast: (message: string) => void;
}

// ─── Render
export function PromoBanner({ onShowToast }: PromoBannerProps) {
  const handleCopyCode = () => {
    onShowToast('✅ تم نسخ الكود: QARYA1');
  };

  return (
    <section className="promo" aria-label="عرض ترويجي">
      <div className="promo-text">
        <h4>🎉 أول طلب مجاني!</h4>
        <p>تسجل دلوقتي واستمتع بأول توصيل مجاني</p>
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
