// ─── Imports
import { Button } from '@/components/ui/Button';
import type { OrderModalData } from '@/types';

// ─── Types
interface HeroProps {
  onOpenOrder: (data: OrderModalData) => void;
}

// ─── Component
export function Hero({ onOpenOrder }: HeroProps) {
  const handleClick = () => {
    onOpenOrder({
      emoji: '🚀',
      name: 'اطلب دلوقتي',
      desc: 'اختار الخدمة اللي محتاجها وهنوصلهالك في أسرع وقت',
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
        <p>خدمات القرية في إيدك - سريع وبأسعار منافسة وبدعم شباب القرية</p>
        <Button variant="gold" size="md" onClick={handleClick} className="hero-btn">
          ابدأ اطلب الآن ⬅️
        </Button>
      </div>

      <div className="hero-illustration" aria-hidden="true">
        <span className="hero-emoji-main">🛵</span>
        <div className="hero-circle circle-1" />
        <div className="hero-circle circle-2" />
      </div>
    </section>
  );
}
