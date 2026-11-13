import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import { HERO_SLIDES } from './heroSlides';

interface HeroProps { onSelectService: (serviceId: number) => void; }
export function Hero({ onSelectService }: HeroProps) {
  const [carousel, setCarousel] = useState({ index: 0, visited: new Set([0]) });
  const { index, visited } = carousel;
  const setIndex = useCallback((next: number | ((current: number) => number)) => {
    setCarousel(current => {
      const index = typeof next === 'function' ? next(current.index) : next;
      return { index, visited: new Set([...current.visited, index]) };
    });
  }, []);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touchX = useRef<number | null>(null);
  useEffect(() => {
    if (paused || hovered || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setIndex(current => (current + 1) % HERO_SLIDES.length), 5500);
    return () => window.clearTimeout(timer);
  }, [index, paused, hovered, setIndex]);
  return (
    <section className="mb-5" aria-roledescription="كاروسيل" aria-label="اكتشف خدمات قريتي" onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setHovered(true); }} onMouseLeave={() => setHovered(false)}>
      <div className="relative overflow-hidden rounded-[24px] bg-green-dark h-[224px] sm:h-[250px] lg:h-[300px] touch-pan-y" onTouchStart={event => { touchX.current = event.changedTouches[0].clientX; }} onTouchEnd={event => { if (touchX.current !== null) { const delta = event.changedTouches[0].clientX - touchX.current; if (Math.abs(delta) > 45) setIndex(current => (current + (delta > 0 ? 1 : -1) + HERO_SLIDES.length) % HERO_SLIDES.length); } touchX.current = null; }}>
        {HERO_SLIDES.map((slide, i) => (
          <div key={slide.id} aria-hidden={index !== i} inert={index !== i} className={`absolute inset-0 transition-opacity duration-500 text-white ${index === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {(index === i || visited.has(i)) && <img src={`/img/home-refresh/banner-${slide.id}.webp`} alt="" width={1200} height={600} fetchPriority={i === 0 ? "high" : "low"} decoding="async" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="relative z-10 w-[60%] h-full flex flex-col justify-center px-4 sm:px-8">
              <span className="text-[10px] sm:text-xs font-bold opacity-85 mb-1">{slide.eyebrow}</span>
              <h2 className="font-black font-['Tajawal',sans-serif] text-[23px] sm:text-[36px] leading-tight mb-1">{slide.title}</h2>
              <p className="text-[10px] sm:text-sm leading-5 max-w-[180px] sm:max-w-none opacity-90 mb-3">{slide.line}</p>
              <button type="button" className="self-start inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] sm:text-sm font-extrabold bg-gold text-green-dark" onClick={() => onSelectService(slide.serviceId)}>{slide.cta}<ChevronLeft size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 gap-1" dir="ltr">
        <span className="text-[10px] text-text-muted w-8 text-center tabular-nums" aria-live="off">{index + 1}/{HERO_SLIDES.length}</span>
        <div className="flex items-center justify-center">
          {HERO_SLIDES.map((slide,i) => <button key={slide.id} type="button" aria-label={`عرض البانر ${i+1}`} title={slide.eyebrow} aria-pressed={index===i} className="h-8 w-5 sm:w-6 flex items-center justify-center" onClick={() => setIndex(i)}><span className={`h-1.5 rounded-full transition-all ${index===i ? 'w-4 bg-green' : 'w-1.5 bg-green/20'}`} /></button>)}
        </div>
        <button type="button" aria-label={paused ? 'تشغيل البانرات' : 'إيقاف البانرات'} onClick={() => setPaused(value=>!value)} className="w-8 h-8 flex items-center justify-center text-green/60">{paused ? <Play size={12}/> : <Pause size={12}/>}</button>
      </div>
    </section>
  );
}
