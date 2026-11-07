import { useRef, useState } from 'react';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';

export function ServiceImageGallery({ images, name }: { images: string[]; name: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  if (images.length === 1) return failed[images[0]] ? <ImagePlaceholder className="w-full h-full" /> : <img src={images[0]} alt="" width={720} height={480} loading="lazy" decoding="async" onError={() => setFailed(s => ({ ...s, [images[0]]: true }))} className="w-full h-full object-cover object-center" />;
  const go = (i: number) => rail.current?.scrollTo({ left: i * rail.current.clientWidth, behavior: 'instant' });
  return <div className="relative z-20 w-full h-full" role="group" aria-label={`صور ${name}`}>
    <div ref={rail} dir="ltr" className="flex w-full h-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onScroll={event => setActive(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
      {images.map((src, i) => <div key={src} className="w-full h-full shrink-0 snap-center" aria-hidden={active !== i}>
        {failed[src] ? <ImagePlaceholder className="w-full h-full" /> : <img src={src} alt={`${name}، صورة ${i + 1}`} width={720} height={480} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(s => ({ ...s, [src]: true }))} className="w-full h-full object-cover object-center" />}
      </div>)}
    </div>
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex bg-white/95 rounded-full px-1" dir="ltr">
      {images.map((src, i) => <button key={src} type="button" aria-label={`صورة ${i + 1} من ${images.length} لـ${name}`} aria-pressed={active === i} onClick={() => go(i)} className="w-6 h-6 flex items-center justify-center"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${active === i ? 'bg-green' : 'bg-gray-400'}`} /></button>)}
    </div>
  </div>;
}
