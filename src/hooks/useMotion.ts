import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { MOTION } from '@/config/motion';

export function useMotion(ref: RefObject<HTMLDivElement | null>) {
  const { pathname } = useLocation();
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const { duration, distance, stagger } = MOTION;
    const animation = media.matches ? null : root.animate([
      { opacity: 0, transform: `translateY(${Math.min(distance, 8)}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: Math.min(duration, 220), easing: 'cubic-bezier(.2,0,0,1)' });
    const reveal = new IntersectionObserver(entries => {
      let index = 0;
      for (const entry of entries) if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        if (!media.matches) {
          el.style.setProperty('--motion-delay', `${Math.min(index++, 3) * stagger}ms`);
          el.classList.add('motion-enter');
          el.addEventListener('animationend', () => el.classList.remove('motion-enter'), { once: true });
        }
        reveal.unobserve(el);
      }
    }, { threshold: 0.12 });
    function scan() {
      root?.querySelectorAll<HTMLElement>('.motion-card:not([data-motion-watched])').forEach(el => {
        el.dataset.motionWatched = 'true'; reveal.observe(el);
      });
    }
    let frame = 0;
    const mutations = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(scan); });
    mutations.observe(root, { childList: true, subtree: true }); scan();
    const stop = () => { if (media.matches) { animation?.cancel(); root.querySelectorAll('.motion-enter').forEach(el => el.classList.remove('motion-enter')); } };
    media.addEventListener('change', stop);
    return () => { cancelAnimationFrame(frame); mutations.disconnect(); reveal.disconnect(); animation?.cancel(); media.removeEventListener('change', stop); root.querySelectorAll('[data-motion-watched]').forEach(el => el.removeAttribute('data-motion-watched')); };
  }, [pathname, ref]);
}
