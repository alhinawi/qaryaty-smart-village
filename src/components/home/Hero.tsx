// ─── Imports
import type { OrderModalData } from '@/types';

// ─── Types
interface HeroProps {
  onOpenModal: (service: OrderModalData) => void;
}

// ─── Render
export function Hero({ onOpenModal }: HeroProps) {
  const handleClick = () => {
    onOpenModal({
      emoji: '🚀',
      name: 'اطلب دلوقتي',
      desc: 'اختار الخدمة اللي محتاجها',
    });
  };

  return (
    <section className="hero" aria-label="بانر البداية">
      <div className="hero-content">
        <div className="hero-badge">🌟 القرية الذكية</div>
        <h2>
          كل اللي محتاجه
          <br />
          على بابك!
        </h2>
        <p>خدمات القرية في إيدك - سريع وبأسعار منافسة</p>
        <button
          type="button"
          className="hero-btn"
          onClick={handleClick}
        >
          ابدأ اطلب الآن ⬅️
        </button>
      </div>
      <div className="hero-emoji" role="img" aria-hidden="true">
        🛵
      </div>
    </section>
  );
}
