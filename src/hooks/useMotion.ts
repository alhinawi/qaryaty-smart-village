import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
/** Route-only tiny movement. Scrolling never hides/reveals/reanimates cards. */
export function useMotion(ref:RefObject<HTMLDivElement|null>){const{pathname}=useLocation();useEffect(()=>{const root=ref.current;if(!root)return;const media=matchMedia('(prefers-reduced-motion: reduce)');const animation=media.matches?null:root.animate([{transform:'translateY(3px)'},{transform:'none'}],{duration:140,easing:'ease-out'});const stop=()=>{if(media.matches)animation?.cancel();};media.addEventListener('change',stop);return()=>{animation?.cancel();media.removeEventListener('change',stop);};},[pathname,ref]);}
