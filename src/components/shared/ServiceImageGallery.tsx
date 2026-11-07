import { useEffect, useRef, useState } from 'react';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';

/** Gentle auto-advance: every 4.5s, pauses on touch/drag/hover and when the tab is hidden. */
const AUTO_ADVANCE_MS = 4500;
/** After the user touches the rail, wait this long before auto-advance resumes. */
const RESUME_AFTER_TOUCH_MS = 9000;

export function ServiceImageGallery({ images, name }: { images: string[]; name: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const pausedUntil = useRef(0);
  const [hovering, setHovering] = useState(false);

  // Auto-advance the photos. Never with reduced motion, while the user is
  // touching/hovering, or while the tab is hidden.
  useEffect(() => {
    if (images.length < 2) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const timer = window.setInterval(() => {
      if (reduced.matches || document.hidden || hovering) return;
      if (Date.now() < pausedUntil.current) return;
      const el = rail.current;
      if (!el) return;
      const count = images.length;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: ((current + 1) % count) * el.clientWidth, behavior: 'smooth' });
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [images.length, hovering]);

  if (images.length === 1) return failed[images[0]] ? <ImagePlaceholder className="w-full h-full" /> : <img src={images[0]} alt="" width={720} height={480} loading="lazy" decoding="async" onError={() => setFailed(s => ({ ...s, [images[0]]: true }))} className="w-full h-full object-cover object-center" />;
  const go = (i: number) => rail.current?.scrollTo({ left: i * rail.current.clientWidth, behavior: 'smooth' });
  const pauseBriefly = () => { pausedUntil.current = Date.now() + RESUME_AFTER_TOUCH_MS; };
  return <div className="relative z-20 w-full h-full" role="group" aria-label={`صور ${name}`}>
    <div ref={rail} tabIndex={0} aria-label={`اسحب صور ${name} أو استخدم أزرار الصور`} dir="ltr"
      className="flex w-full h-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onScroll={event => setActive(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}
      onPointerDown={pauseBriefly}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      {images.map((src, i) => <div key={src} className="w-full h-full shrink-0 snap-center" aria-hidden={active !== i}>
        {failed[src] ? <ImagePlaceholder className="w-full h-full" /> : <img src={src} alt={`${name}، صورة ${i + 1}`} width={720} height={480} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(s => ({ ...s, [src]: true }))} className="w-full h-full object-cover object-center" />}
      </div>)}
    </div>
    {/* Tiny dots, no pill: they sit on the photo without covering it. */}
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex" dir="ltr">
      {images.map((src, i) => <button key={src} type="button" aria-label={`صورة ${i + 1} من ${images.length} لـ${name}`} aria-pressed={active === i} onClick={() => { pauseBriefly(); go(i); }} className="w-6 h-6 flex items-center justify-center"><span aria-hidden="true" className={`h-1 w-1 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.9)] ${active === i ? 'bg-white' : 'bg-white/55'}`} /></button>)}
    </div>
  </div>;
}
