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
    <section className="bg-gradient-to-br from-green to-green-dark rounded-xl p-6 relative overflow-hidden text-white mb-6 flex flex-col justify-between md:flex-row md:items-center md:py-9 md:px-10" aria-label="بانر البداية">
      <div className="relative z-2 max-w-[580px]">
        <div className="inline-block bg-gold text-black text-[0.8125rem] font-extrabold px-3 py-1 rounded-[20px] mb-3">🌟 القرية الذكية</div>
        <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black font-['Tajawal',sans-serif] mb-2 leading-[1.2]">
          كل اللي محتاجه
          <br />
          على بابك!
        </h2>
        <p className="text-[clamp(0.875rem,2vw,1.0625rem)] opacity-[0.88] mb-5 leading-[1.5]">خدمات القرية في إيدك - سريع وبأسعار منافسة وبدعم شباب القرية</p>
        <Button variant="gold" size="md" onClick={handleClick} className="text-[0.9375rem] font-extrabold">
          ابدأ اطلب الآن ⬅️
        </Button>
      </div>

      <div className="relative flex items-center justify-center mt-4 md:mt-0 md:mr-8" aria-hidden="true">
        <span className="text-[clamp(4rem,8vw,6.5rem)] relative z-2 [animation:floatEmoji_3s_ease-in-out_infinite]">🛵</span>
        <div className="absolute rounded-full pointer-events-none w-[140px] h-[140px] bg-white/8 -top-5 -left-5" />
        <div className="absolute rounded-full pointer-events-none w-[180px] h-[180px] bg-[rgba(240,165,0,0.12)] -bottom-[30px] -right-[30px]" />
      </div>
    </section>
  );
}
